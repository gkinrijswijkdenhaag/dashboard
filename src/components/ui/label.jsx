import * as React from "react";

const Label = React.forwardRef(({ className, htmlFor, ...props }, ref) => {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
        className || ""
      }`}
      ref={ref}
      htmlFor={htmlFor}
      {...props}
    />
  );
});

Label.displayName = "Label";

export { Label };
