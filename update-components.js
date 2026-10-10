const fs = require('fs');
const path = require('path');

function replaceFile(filepath, replaces) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (const { from, to } of replaces) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(filepath, content);
}

// Input
replaceFile('./components/ui/input.tsx', [
  {
    from: /className=\{cn\([\s\S]*?className\n\s*\)\}/,
    to: `className={cn(
        "flex h-9 w-full rounded-none border-2 border-black bg-white px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black focus-visible:shadow-[4px_4px_0px_#0A0A0A] dark:focus-visible:shadow-[4px_4px_0px_#F5F5F0] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}`
  }
]);

// Textarea
replaceFile('./components/ui/textarea.tsx', [
  {
    from: /className=\{cn\([\s\S]*?className\n\s*\)\}/,
    to: `className={cn(
        "flex min-h-[60px] w-full rounded-none border-2 border-black bg-white px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black focus-visible:shadow-[4px_4px_0px_#0A0A0A] dark:focus-visible:shadow-[4px_4px_0px_#F5F5F0] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}`
  }
]);

// Badge
replaceFile('./components/ui/badge.tsx', [
  {
    from: /const badgeVariants = cva\([\s\S]*?\)\n/,
    to: `const badgeVariants = cva(
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
)\n`
  }
]);

// Alert
replaceFile('./components/ui/alert.tsx', [
  {
    from: /const alertVariants = cva\([\s\S]*?\)\n/,
    to: `const alertVariants = cva(
  "relative w-full rounded-none border-2 border-black p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground shadow-[4px_4px_0px_#0A0A0A] dark:shadow-[4px_4px_0px_#F5F5F0] bg-background text-foreground",
  {
    variants: {
      variant: {
        default: "border-l-[6px] border-l-black dark:border-l-white",
        destructive:
          "border-l-[6px] border-l-[#FF2D2D] [&>svg]:text-[#FF2D2D]",
        success:
          "border-l-[6px] border-l-[#00C853] [&>svg]:text-[#00C853]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)\n`
  }
]);

// Dialog
replaceFile('./components/ui/dialog.tsx', [
  {
    from: /className=\{cn\(\n\s*"fixed inset-0 z-50 bg-black\/80[\s\S]*?className\n\s*\)\}/,
    to: `className={cn(
      "fixed inset-0 z-50 bg-[rgba(0,0,0,0.7)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}`
  },
  {
    from: /className=\{cn\(\n\s*"fixed left-\[50%\][\s\S]*?className\n\s*\)\}/,
    to: `className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-2 border-black bg-background p-6 shadow-[8px_8px_0px_#0A0A0A] dark:shadow-[8px_8px_0px_#F5F5F0] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-none",
        className
      )}`
  },
  {
    from: /className=\{cn\(\n\s*"flex flex-col space-y-1\.5 text-center sm:text-left",\n\s*className\n\s*\)\}/,
    to: `className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left border-b-2 border-black pb-4 mb-4",
      className
    )}`
  }
]);

// Table
replaceFile('./components/ui/table.tsx', [
  {
    from: /className=\{cn\("relative w-full overflow-auto", className\)\}/,
    to: `className={cn("relative w-full overflow-auto border-2 border-black", className)}`
  },
  {
    from: /className=\{cn\("\[&_tr\]:border-b", className\)\}/,
    to: `className={cn("[&_tr]:border-b [&_tr]:border-black bg-[#0A0A0A] text-[#F5F5F0] font-bold dark:bg-[#F5F5F0] dark:text-[#0A0A0A]", className)}`
  },
  {
    from: /className=\{cn\(\n\s*"border-b transition-colors hover:bg-muted\/50 data-\[state=selected\]:bg-muted",\n\s*className\n\s*\)\}/,
    to: `className={cn(
      "border-b border-black transition-colors hover:bg-[#FFDD00] hover:text-[#0A0A0A] data-[state=selected]:bg-[#FFDD00] data-[state=selected]:text-[#0A0A0A]",
      className
    )}`
  },
  {
    from: /className=\{cn\("p-2 align-middle \[&:has\(\[role=checkbox\]\)\]:pr-0 \[&>\[role=checkbox\]\]:translate-y-\[2px\]", className\)\}/,
    to: `className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-[0.875rem]", className)}`
  }
]);

// Tabs
replaceFile('./components/ui/tabs.tsx', [
  {
    from: /className=\{cn\(\n\s*"inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",\n\s*className\n\s*\)\}/,
    to: `className={cn(
      "inline-flex h-9 items-center justify-center rounded-none border-2 border-black bg-muted p-0 text-muted-foreground",
      className
    )}`
  },
  {
    from: /className=\{cn\(\n\s*"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1\.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-\[state=active\]:bg-background data-\[state=active\]:text-foreground data-\[state=active\]:shadow",\n\s*className\n\s*\)\}/,
    to: `className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-none px-3 py-1.5 text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-r-2 border-black last:border-r-0 data-[state=active]:bg-[#0A0A0A] data-[state=active]:text-[#F5F5F0] dark:data-[state=active]:bg-[#F5F5F0] dark:data-[state=active]:text-[#0A0A0A]",
      className
    )}`
  }
]);

console.log('Components updated.');
