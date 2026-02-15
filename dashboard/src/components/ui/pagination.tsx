import { ComponentProps } from "react"
import {
  CaretLeft,
  CaretRight,
  DotsThree,
} from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  onClick?: () => void
} & Pick<ComponentProps<typeof Button>, "size"> &
  ComponentProps<"button">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        isActive &&
          "border-primary text-primary hover:bg-primary/10 dark:border-primary dark:text-primary",
        className
      )}
      {...props}
    />
  )
}

interface PaginationPreviousProps extends ComponentProps<"button"> {
  disabled?: boolean
  onClick?: () => void
}

function PaginationPrevious({
  className,
  disabled,
  onClick,
  ...props
}: PaginationPreviousProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-1 pl-2.5", className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      <CaretLeft className="size-4" />
      <span>Anterior</span>
    </Button>
  )
}

interface PaginationNextProps extends ComponentProps<"button"> {
  disabled?: boolean
  onClick?: () => void
}

function PaginationNext({
  className,
  disabled,
  onClick,
  ...props
}: PaginationNextProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-1 pr-2.5", className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      <span>Próximo</span>
      <CaretRight className="size-4" />
    </Button>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <DotsThree className="size-4" />
      <span className="sr-only">Mais páginas</span>
    </span>
  )
}

// Componente completo de paginação com lógica de navegação
interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  // Gera array de páginas a serem exibidas
  const getPageNumbers = () => {
    const delta = 2 // Quantidade de páginas antes e depois da atual
    const range: (number | string)[] = []
    const rangeWithDots: (number | string)[] = []

    // Se total de páginas <= 7, mostra todas
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Sempre inclui primeira página
    range.push(1)

    // Páginas ao redor da atual
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    // Sempre inclui última página
    range.push(totalPages)

    // Adiciona "..." onde necessário
    let prev = 0
    for (const i of range) {
      if (typeof i === "number" && prev && i - prev > 1) {
        rangeWithDots.push("...")
      }
      rangeWithDots.push(i)
      if (typeof i === "number") prev = i
    }

    return rangeWithDots
  }

  const pages = getPageNumbers()

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
        </PaginationItem>

        {pages.map((page, index) =>
          typeof page === "number" ? (
            <PaginationItem key={index}>
              <PaginationLink
                isActive={currentPage === page}
                onClick={() => onPageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={index}>
              <PaginationEllipsis />
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationControls,
}
