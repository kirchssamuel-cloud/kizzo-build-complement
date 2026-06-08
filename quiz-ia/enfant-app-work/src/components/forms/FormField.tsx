import * as React from 'react';
import { View } from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { cn } from '~/lib/cn';
import { Label } from '../ui/Label';
import { Input, PasswordInput } from '../ui/Input';
import { Text } from '../ui/Text';

type Common<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: React.ReactNode;
  description?: string;
  className?: string;
};

type FormFieldProps<TFieldValues extends FieldValues> = Common<TFieldValues> & {
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  autoComplete?: React.ComponentProps<typeof Input>['autoComplete'];
  keyboardType?: React.ComponentProps<typeof Input>['keyboardType'];
  rightSlot?: React.ReactNode;
  leftSlot?: React.ReactNode;
};

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  type = 'text',
  rightSlot,
  leftSlot,
  ...inputProps
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const Field = type === 'password' ? PasswordInput : Input;
        return (
          <View className={cn('gap-2', className)}>
            {label ? (
              typeof label === 'string' ? (
                <Label>{label}</Label>
              ) : (
                label
              )
            ) : null}
            <Field
              {...inputProps}
              keyboardType={
                inputProps.keyboardType ?? (type === 'email' ? 'email-address' : undefined)
              }
              autoCapitalize={type === 'email' ? 'none' : undefined}
              value={field.value as string | undefined}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              invalid={!!fieldState.error}
              {...(type !== 'password' ? { rightSlot, leftSlot } : {})}
            />
            {fieldState.error?.message ? (
              <Text className="pl-2 text-[12px] text-kz-red">{fieldState.error.message}</Text>
            ) : description ? (
              <Text className="pl-2 text-[12px] text-kz-white/60">{description}</Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}
