'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const AccordionMenu = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
    selectedValue?: string | string[];
    matchPath?: (href: string) => boolean;
    classNames?: {
      group?: string;
      separator?: string;
      item?: string;
      sub?: string;
      subTrigger?: string;
      subContent?: string;
      indicator?: string;
    };
  }
>(({ className, selectedValue, matchPath, classNames, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={cn('w-full', className)}
    {...props}
  />
));
AccordionMenu.displayName = 'AccordionMenu';

const AccordionMenuGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-1', className)}
    {...props}
  />
));
AccordionMenuGroup.displayName = 'AccordionMenuGroup';

const AccordionMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide',
      className
    )}
    {...props}
  />
));
AccordionMenuLabel.displayName = 'AccordionMenuLabel';

const AccordionMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('h-px bg-border', className)}
    {...props}
  />
));
AccordionMenuSeparator.displayName = 'AccordionMenuSeparator';

const AccordionMenuItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & {
    variant?: 'default' | 'destructive';
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      'border rounded-md overflow-hidden',
      variant === 'destructive' && 'border-destructive text-destructive',
      className
    )}
    {...props}
  />
));
AccordionMenuItem.displayName = 'AccordionMenuItem';

const AccordionMenuTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center gap-2 px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionMenuTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionMenuContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionMenuContent.displayName = AccordionPrimitive.Content.displayName;

const AccordionMenuIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('ml-auto', className)}
    {...props}
  />
));
AccordionMenuIndicator.displayName = 'AccordionMenuIndicator';

export {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuLabel,
  AccordionMenuSeparator,
  AccordionMenuItem,
  AccordionMenuTrigger,
  AccordionMenuContent,
  AccordionMenuIndicator,
};
