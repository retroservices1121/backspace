import React from 'react';
import { FieldProps, FormikHelpers } from 'formik';

/** Type for components passed to a formik <Field/>'s `component` prop */
export type Input<Values, ExtraProps = {}> = React.FC<FieldProps<Values> & ExtraProps>;
/** Type for components passed to a formik <Field/>'s `as` prop */
export type AsInput<Values, ExtraProps = {}> = React.FC<FieldProps<Values>['field'] & ExtraProps>;

export type OnSubmit<Values> = (state: Values, formikHelpers: FormikHelpers<Values>) => void;

export type FormType<Values, ExtraProps = {}> = React.FC<ExtraProps & {
  onSubmit: OnSubmit<Values>
}>;