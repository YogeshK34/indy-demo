import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border-2 border-black px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#0A0A0A] text-[#F5F5F0] dark:bg-[#F5F5F0] dark:text-[#0A0A0A]",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-[#FF2D2D] text-[#F5F5F0]",
        outline: "text-foreground",
        success: "bg-[#00C853] text-[#0A0A0A]",
        accent: "bg-[#FFDD00] text-[#0A0A0A]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
