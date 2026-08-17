/**
 * Components — the design system's vocabulary.
 *
 * Every entry here is product-agnostic: it knows about tone, size and layout, and nothing
 * about contracts, clauses or documents. Anything that knows what a document is belongs in
 * `../patterns`.
 *
 * ### The `*Variants` exports
 *
 * Each component also exports its `cva` matrix. That is not for restyling — a caller
 * composing `buttonVariants()` onto a random `<div>` produces something that looks like a
 * button, is not focusable, and has no `type`. It exists for two legitimate uses: styling a
 * `<Link>` that is genuinely a navigation button (`<Button asChild>` is preferred, this is
 * the fallback), and asserting in tests that two components resolve to the same classes.
 *
 * ### Ordering
 *
 * Alphabetical, not grouped by kind. Groupings ("form", "layout", "overlay") invite arguments
 * about which group `Field` belongs to and are wrong for at least one component the moment a
 * new one is added. Alphabetical is boring and never needs a decision.
 */

export { Accordion, AccordionItem, accordionVariants, accordionItemVariants } from './accordion';
export type { AccordionProps, AccordionItemProps } from './accordion';

export { Alert, alertVariants } from './alert';
export type { AlertProps } from './alert';

export { Avatar, avatarVariants } from './avatar';
export type { AvatarProps } from './avatar';

export { Badge, badgeVariants } from './badge';
export type { BadgeProps } from './badge';

export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
} from './card';
export type { CardProps, CardTitleProps } from './card';

export { ClearSessionButton } from './clear-session-button';

export { Checkbox } from './checkbox';
export type { CheckboxProps } from './checkbox';

export { Container, containerVariants } from './container';
export type { ContainerProps } from './container';

/**
 * The shared input chrome — border, height, focus ring, disabled treatment — used by `Input`,
 * `Select` and `Textarea`. Exported so a feature building a bespoke control (a token input, a
 * date picker) matches the others by construction instead of by eyeballing.
 */
export { controlVariants } from './control';
export type { ControlVariantProps } from './control';

export { Dialog, dialogVariants, panelVariants as dialogPanelVariants } from './dialog';
export type { DialogProps } from './dialog';

export { Drawer, drawerHostVariants, drawerPanelVariants } from './drawer';
export type { DrawerProps } from './drawer';

export { Field } from './field';
export type { FieldProps, FieldControlProps } from './field';

export { Heading, headingVariants, SIZE_FOR_LEVEL } from './heading';
export type { HeadingLevel, HeadingProps } from './heading';

export { Input } from './input';
export type { InputProps } from './input';

export { Label } from './label';
export type { LabelProps } from './label';

export { Progress } from './progress';
export type { ProgressProps } from './progress';

export { Section, sectionVariants } from './section';
export type { SectionProps } from './section';

export { Select } from './select';
export type { SelectProps } from './select';

export { Separator } from './separator';
export type { SeparatorProps } from './separator';

export { Skeleton } from './skeleton';
export type { SkeletonProps } from './skeleton';

export { Spinner } from './spinner';
export type { SpinnerProps } from './spinner';

export { Stack, stackVariants } from './stack';
export type { StackProps } from './stack';

export { Switch } from './switch';
export type { SwitchProps } from './switch';

export { Tabs, tabListVariants, tabVariants } from './tabs';
export type { TabItem, TabsProps } from './tabs';

export { Text, textVariants } from './text';
export type { TextProps } from './text';

export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';

export { Tooltip, tooltipVariants } from './tooltip';
export type { TooltipProps } from './tooltip';
