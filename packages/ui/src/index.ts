/**
 * @hsafx/ui Package
 * HSAFX WORLD - Shared UI components and theme system
 */

// Theme System — re-export from canonical @hsafx/theme package
export * from '@hsafx/theme';

// Theme Provider
export { ThemeProvider, useTheme, useThemeMode } from './components/theme-provider';
export type { ThemeContextValue } from './components/theme-provider';

// Utility
export { cn } from './lib/utils';

// UI Components
export { Alert, AlertTitle, AlertDescription } from './components/alert';
export { Badge, badgeVariants, type BadgeProps } from './components/badge';
export { Button, buttonVariants, type ButtonProps } from './components/button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/card';
export { Checkbox } from './components/checkbox';
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './components/dialog';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from './components/dropdown-menu';
export { Input, type InputProps } from './components/input';
export { Label, type LabelProps } from './components/label';
export { Progress, CircularProgress } from './components/progress';
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './components/select';
export { Skeleton, SkeletonText, SkeletonCard } from './components/skeleton';
export { Switch } from './components/switch';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/tabs';
export { Textarea, type TextareaProps } from './components/textarea';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/tooltip';
