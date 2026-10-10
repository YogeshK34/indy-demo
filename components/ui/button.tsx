import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border-2 border-black font-bold transition-all whitespace-nowrap outline-none select-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[4px_4px_0px_#0A0A0A] dark:shadow-[4px_4px_0px_#F5F5F0] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] dark:hover:shadow-[6px_6px_0px_#F5F5F0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        destructive:
          "bg-destructive text-primary-foreground shadow-[4px_4px_0px_#0A0A0A] dark:shadow-[4px_4px_0px_#F5F5F0] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] dark:hover:shadow-[6px_6px_0px_#F5F5F0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        outline:
          "bg-transparent hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#0A0A0A] dark:hover:shadow-[4px_4px_0px_#F5F5F0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        secondary:
          "bg-accent text-accent-foreground shadow-[4px_4px_0px_#0A0A0A] dark:shadow-[4px_4px_0px_#F5F5F0] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] dark:hover:shadow-[6px_6px_0px_#F5F5F0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        ghost:
          "border-transparent hover:bg-muted dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
