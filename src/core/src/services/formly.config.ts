import { Injectable, Inject, InjectionToken } from '@angular/core';
import { FormlyGroup } from '../components/formly.group';
import { Field } from './../templates/field';
import { reverseDeepMerge } from './../utils';
import { FormlyFieldConfig } from '../components/formly.field.config';

export const FORMLY_CONFIG_TOKEN = new InjectionToken<FormlyConfig>('FORMLY_CONFIG_TOKEN');

/**
 * Maintains list of formly field directive types. This can be used to register new field templates.
 */
@Injectable()
export class FormlyConfig {
  types: {[name: string]: TypeOption} = {
    'formly-group': {
      name: 'formly-group',
      component: FormlyGroup,
    },
  };
  validators: {[name: string]: ValidatorOption} = {};
  wrappers: {[name: string]: WrapperOption} = {};
  messages: { [name: string]: string; } = {};

  templateManipulators: {
    preWrapper: ManipulatorWrapper[];
    postWrapper: ManipulatorWrapper[];
  } = {
    preWrapper: [],
    postWrapper: [],
  };

  extras: {
    fieldTransform?: any,
    showError?: (field: Field) => boolean;
  } = {
    fieldTransform: undefined,
    showError: function(field: Field) {
      return (field.formControl.dirty || (field.options.parentForm && field.options.parentForm.submitted) || (field.field.validation && field.field.validation.show)) && field.formControl.invalid;
    },
  };

  constructor(@Inject(FORMLY_CONFIG_TOKEN) configs: ConfigOption[] = []) {
    configs.map(config => this.addConfig(config));
  }

  addConfig(config: ConfigOption) {
    if (config.types) {
      config.types.map(type => this.setType(type));
    }
    if (config.validators) {
      config.validators.map(validator => this.setValidator(validator));
    }
    if (config.wrappers) {
      config.wrappers.map(wrapper => this.setWrapper(wrapper));
    }
    if (config.manipulators) {
      config.manipulators.map(manipulator => this.setManipulator(manipulator));
    }
    if (config.validationMessages) {
      config.validationMessages.map(validation => this.addValidatorMessage(validation.name, validation.message));
    }
    if (config.extras) {
      this.extras = { ...this.extras, ...config.extras };
    }
  }

  setType(options: TypeOption | TypeOption[]) {
    if (Array.isArray(options)) {
      options.map((option) => this.setType(option));
    } else {
      if (!this.types[options.name]) {
        this.types[options.name] = <TypeOption>{};
      }
      this.types[options.name].component = options.component;
      this.types[options.name].name = options.name;
      this.types[options.name].extends = options.extends;
      this.types[options.name].defaultOptions = options.defaultOptions;
      if (options.wrappers) {
        options.wrappers.map((wrapper) => this.setTypeWrapper(options.name, wrapper));
      }
    }
  }

  getType(name: string): TypeOption {
    if (!this.types[name]) {
      throw new Error(`[Formly Error] There is no type by the name of "${name}"`);
    }

    this.mergeExtendedType(name);

    return this.types[name];
  }

  getMergedField(field: FormlyFieldConfig = {}): any {
    let name = field.type;
    if (!this.types[name]) {
      throw new Error(`[Formly Error] There is no type by the name of "${name}"`);
    }

    this.mergeExtendedType(name);
    if (this.types[name].defaultOptions) {
      reverseDeepMerge(field, this.types[name].defaultOptions);
    }

    let extendDefaults = this.types[name].extends && this.getType(this.types[name].extends).defaultOptions;
    if (extendDefaults) {
      reverseDeepMerge(field, extendDefaults);
    }

    if (field && field.optionsTypes) {
      field.optionsTypes.map(option => {
        let defaultOptions = this.getType(option).defaultOptions;
        if (defaultOptions) {
          reverseDeepMerge(field, defaultOptions);
        }
      });
    }

    if (!field.component) {
      field.component = this.types[name].component;
    }

    if (!field.wrappers) {
      field.wrappers = this.types[name].wrappers;
    }
  }

  setWrapper(options: WrapperOption) {
    this.wrappers[options.name] = options;
    if (options.types) {
      options.types.map((type) => {
        this.setTypeWrapper(type, options.name);
      });
    }
  }

  getWrapper(name: string): WrapperOption {
    if (!this.wrappers[name]) {
      throw new Error(`[Formly Error] There is no wrapper by the name of "${name}"`);
    }

    return this.wrappers[name];
  }

  setTypeWrapper(type: string, name: string) {
    if (!this.types[type]) {
      this.types[type] = <TypeOption>{};
    }
    if (!this.types[type].wrappers) {
      this.types[type].wrappers = <[string]>[];
    }
    this.types[type].wrappers.push(name);
  }

  setValidator(options: ValidatorOption) {
    this.validators[options.name] = options;
  }

  getValidator(name: string): ValidatorOption {
    if (!this.validators[name]) {
      throw new Error(`[Formly Error] There is no validator by the name of "${name}"`);
    }

    return this.validators[name];
  }

  addValidatorMessage(name: string, message: string) {
    this.messages[name] = message;
  }

  getValidatorMessage(name: string) {
    return this.messages[name];
  }

  setManipulator(manipulator: ManipulatorOption) {
    new manipulator.class()[manipulator.method](this);
  }

  private mergeExtendedType(name: string) {
    if (!this.types[name].extends) {
      return;
    }

    const extendedType = this.getType(this.types[name].extends);
    if (!this.types[name].component) {
      this.types[name].component = extendedType.component;
    }

    if (!this.types[name].wrappers) {
      this.types[name].wrappers = extendedType.wrappers;
    }
  }
}
export interface TypeOption {
  name: string;
  component?: any;
  wrappers?: string[];
  extends?: string;
  defaultOptions?: FormlyFieldConfig;
}

export interface WrapperOption {
  name: string;
  component: any;
  types?: string[];
}

export interface ValidatorOption {
  name: string;
  validation: any;
}

export interface ValidationMessageOption {
  name: string;
  message: any;
}

export interface ManipulatorOption {
  class?: { new (): any };
  method?: string;
}

export interface ManipulatorWrapper {
  (f: FormlyFieldConfig): string;
}

export interface ConfigOption {
  types?: TypeOption[];
  wrappers?: WrapperOption[];
  validators?: ValidatorOption[];
  validationMessages?: ValidationMessageOption[];
  manipulators?: ManipulatorOption[];
  extras?: {
    fieldTransform?: any,
    showError?: (field: FormlyFieldConfig) => boolean;
  };
}
