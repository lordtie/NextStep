import React from "react";

const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 transition
                focus:border-sky-400 focus-ring
                dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 ${className}`}
    {...props}
  />
));
export default Input;
