// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect } from 'react';
import { Field, FieldAttributes, Form, Formik, FormikConfig, FormikProps, FormikState, GenericFieldHTMLAttributes, useFormikContext  } from 'formik';

import { Input, OnSubmit } from 'types/forms';
import { Override } from 'types/utilityTypes';

type FormEffectProps<V> = {
  onChange: (state: FormikState<V>) => void;
};

export function FormEffect<V>({ onChange }: React.PropsWithChildren<FormEffectProps<V>>) {
  const formik = useFormikContext<V>();
  useEffect(() => {
    onChange({
      values: formik.values,
      errors: formik.errors,
      touched: formik.touched,
      isSubmitting: formik.isSubmitting,
      isValidating: formik.isValidating,
      submitCount: formik.submitCount,
      status: formik.status,
    });
  }, [formik.values, formik.errors, formik.touched, formik.isSubmitting]);
  return null;
}

export type ReactiveOnChange<V> = (name: keyof V, value: V[keyof V]) => void;

type ReactiveFormProps<V> = Override<FormikConfig<V>, {
  onChange: ReactiveOnChange<V>;
  onSubmit?: FormikConfig<V>['onSubmit'];
}>;

/**
 * A Formik form that submits on every change. Great for settings menus.
 *
 * **Note: This variation of formik Form doesn't need a Form inside**
 * */
export function ReactiveForm<V = object>({
  initialValues,
  onChange,
  children,
  ...props
}: React.PropsWithChildren<ReactiveFormProps<V>>): JSX.Element {
  const handleChange: React.ChangeEventHandler<HTMLFormElement> = ({ target }) => {
    // God dammit html checkboxes
    const value = target.type === 'checkbox' ? target.checked : target.value;
    onChange(target.name as keyof V, value as V[keyof V]);
  };
  return (
    <Formik<V>
      {...props}
      enableReinitialize
      initialValues={initialValues}
      onSubmit={() => console.warn('Reactive forms shouldn\' be submitted normally.')}
    >
      <Form
        onChange={handleChange}
      >
        {children}
      </Form>
    </Formik>
  );
}

/*
  Typeguarding inside the onchange event can be done as follows
  if (fieldName === NotificationsFields.ServerPings) {
    const fieldValue = value as NotificationsState[NotificationsFields.ServerPings];

  }
*/

// If any help is needed understanding how these types work, lemme know. -Sam

type EditableValues<V> = V & {
  _editable: boolean;
};

type EditableChildrenProps<V> = FormikProps<V> & {
  // This is the same type that useState's setState uses.
  setEditable: (editable: boolean | ((state: boolean) => boolean)) => void;
};

type EditableFormProps<V> = Override<FormikConfig<V>, {
  children: (props: EditableChildrenProps<EditableValues<V>>) => React.ReactNode
}>;

/**
 * To be used in conjunction with {@link EditableField}
 *
 * Acts mostly like a normal Formik form but adds an editable state.
 *
 * Form submission happens when editable turns from true to false.
 */
export function EditableForm<V>({
  initialValues, onSubmit, children, ...props
}: EditableFormProps<V>) {
  // In this handler, we remove the _editable before submitting so the dev wants to use formState directly
  const handleSubmit: OnSubmit<V> = (state, helpers) => {
    // @ts-ignore we don't want _editable when submitting
    delete state._editable;
    onSubmit(state as V, helpers);
  };

  return (
    <Formik<V & { _editable: boolean }>
      {...props}
      enableReinitialize
      initialValues={{
        ...initialValues,
        _editable: false,
      }}
      //@ts-ignore When submitting we no longer care about _editable
      onSubmit={handleSubmit}
    >
      {(formikProps) => children({
        ...formikProps,
        setEditable: (next) => {
          if (typeof next === 'function') {
            // If next is a function, we pass it the old value so it can return the new value.
            next = next(formikProps.values._editable);
          }
          formikProps.setFieldValue('_editable', next);
          // If the form editing is being toggled 'off', we submit the form.
          if (!next) {
            formikProps.submitForm();
          }
        },
      })}
    </Formik>
  );
}

type EditableFieldProps = FieldAttributes<any> & {
  displayAs: FieldAttributes<any>['as'];
};

/**
 * To be used in conjunction with {@link EditableForm}
 *
 * Works like a normal field when editable is true; `displayAs` will be used when not editable.
*/
export function EditableField<V = any>({
  displayAs, as, component, ...props
}: EditableFieldProps) {
  const { values } = useFormikContext<EditableValues<V>>();

  return values._editable ? (
    <Field {...props} component={component} as={as}/>
  ) : (
    <Field {...props} as={displayAs}>
      {/* @ts-ignore `values` in formik is set to any via FieldAttributes<any>*/}
      {values[props.name]}
    </Field>
  );
}


type MadeFieldProps<V, P> = GenericFieldHTMLAttributes & P & {
  name: string;
  /** HTML input type */
  type?: string;
  value?: V;
};

export function makeField<V = any, P ={}>(component: Input<V, P>) {
  return (props: MadeFieldProps<V, P>) => (
    <Field
      component={component}
      {...props}
    />
  );
}
