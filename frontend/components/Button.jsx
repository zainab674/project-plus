import { Loader2 } from "lucide-react"

import { Button as SButton } from "@/components/ui/button"

export function Button({children,isLoading, className,disabled,...prev}) {
  return (
    <SButton disabled={disabled} className={className} {...prev}>
        {isLoading && 
            <Loader2 className="animate-spin" />
        }
        {children}
    </SButton>
  )
}
