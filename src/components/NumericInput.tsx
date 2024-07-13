import React from 'react';

type NumericInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>((props, ref) => {
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    let input = e.currentTarget.value.replace(/[^0-9]/g, '');

    if (input.length >= 2 && input.length <= 3) {
      input = input.slice(0, 2) + '/' + input.slice(2);
    } 
    if (input.length >= 5) {
      input = input.slice(0, 5) + '/' + input.slice(5);
    }

    e.currentTarget.value = input;
    if (props.onInput) {
      props.onInput(e);
    }
  };

  return (
    <input
      {...props}
      ref={ref}
      inputMode="numeric"
      onInput={handleInput}
    />
  );
});

export default NumericInput;
