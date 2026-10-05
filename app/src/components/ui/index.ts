/**
 * Every shared building block. Screens import from here only:
 *   import { Button, Card, CardHeader, Field, Input, useToast } from '@/components/ui';
 */
export { Badge, type BadgeProps, type Tone } from './Badge';
export { Button, ButtonLink, buttonClass, type ButtonProps, type ButtonLinkProps, type ButtonVariant, type ButtonSize } from './Button';
export { Card, CardBody, CardFooter, CardHeader, type CardHeaderProps, type CardProps } from './Card';
export { Checkbox, type CheckboxProps } from './Checkbox';
export { ChoiceCard, type ChoiceCardProps } from './ChoiceCard';
export { ClampedText, type ClampedTextProps } from './ClampedText';
export { CodeBlock, type CodeBlockProps } from './CodeBlock';
export { CopyValue, type CopyValueProps } from './CopyValue';
export {
  ConfirmDialog,
  TypedConfirmDialog,
  type ConfirmDialogProps,
  type TypedConfirmDialogProps,
} from './ConfirmDialog';
export { CopyButton, type CopyButtonProps } from './CopyButton';
export { Dialog, type DialogProps } from './Dialog';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type DropdownMenuItemProps,
} from './DropdownMenu';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { FactList, type Fact, type FactListProps } from './FactList';
export { Field, useFieldControl, type FieldProps } from './Field';
export { FilterChips, type FilterChipsProps } from './FilterChips';
export { IconButton, type IconButtonProps } from './IconButton';
export { Input, type InputProps } from './Input';
export { Logo, type LogoProps } from './Logo';
export { Notice, type NoticeProps, type NoticeTone } from './Notice';
export { PageHeader, type PageHeaderProps } from './PageHeader';
export { PlanCard, type PlanCardProps } from './PlanCard';
export { ProgressBar, type ProgressBarProps } from './ProgressBar';
export { SampleDataNote, type SampleDataNoteProps } from './SampleDataNote';
export { SaveBar, useUnsavedGuard, type SaveBarProps } from './SaveBar';
export { SearchField, type SearchFieldProps } from './SearchField';
export { Segmented, type ChoiceItem, type SegmentedProps } from './Segmented';
export { Select, type SelectOption, type SelectProps } from './Select';
export { Skeleton, SkeletonRows, SkeletonText, type SkeletonProps } from './Skeleton';
export { Stat, type StatProps } from './Stat';
export { StatusPill, type StatusPillProps } from './StatusPill';
export { StepList, type Step, type StepListProps, type StepState } from './StepList';
export { Switch, SwitchRow, type SwitchProps, type SwitchRowProps } from './Switch';
export {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  useTableStacked,
  type TableProps,
  type TDProps,
  type THProps,
  type TRProps,
} from './Table';
export { Tabs, TabsContent, TabsList, TabsTrigger, type TabsTriggerProps } from './Tabs';
export { Textarea, type TextareaProps } from './Textarea';
export { TimeSelect, type TimeSelectProps } from './TimeSelect';
export { Toaster, useToast, type ToastTone } from './Toast';
export { Tooltip, TooltipProvider, type TooltipProps } from './Tooltip';
export { Waveform, type WaveformProps } from './Waveform';
export {
  copyFallbackHint,
  copyFallbackSentence,
  useCopy,
  type CopyFallbackSubject,
  type CopyOutcome,
  type CopyState,
} from '@/lib/useCopy';
export { deepEqual, useDraft, type Draft } from '@/lib/useDraft';
export { useContainerWidth } from '@/lib/useContainerWidth';
