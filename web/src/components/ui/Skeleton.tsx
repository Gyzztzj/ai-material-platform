import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const skeletonVariants = cva('animate-pulse', {
  variants: {
    shape: {
      rect: 'rounded-md',
      circle: 'rounded-full',
    },
  },
  defaultVariants: {
    shape: 'rect',
  },
})

interface SkeletonProps
  extends React.ComponentProps<'div'>, VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ shape }), 'bg-muted/70', className)}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }
