"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps extends React.ComponentProps<"label"> {
  required?: boolean;
  optional?: boolean;
}

function Label({ className, children, required, optional, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-1.5 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {required && (
        <span className="text-red-500 font-bold" title="Wajib diisi">
          *
        </span>
      )}
      {optional && (
        <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
          (Opsional)
        </span>
      )}
    </label>
  )
}

export { Label }
