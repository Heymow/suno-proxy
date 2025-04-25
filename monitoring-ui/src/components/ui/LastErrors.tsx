import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, RotateCcw } from "lucide-react"
import { LastError } from "@/types"

export default function LastErrors({
    lastErrors,
    visibleErrors,
    onErrorSelect,
}: {
    lastErrors: LastError[]
    visibleErrors: number
    onErrorSelect: (error: LastError) => void
}) {
    const [dismissed, setDismissed] = useState<Set<number>>(new Set())

    useEffect(() => {
        const stored = localStorage.getItem("dismissedErrors")
        if (stored) {
            setDismissed(new Set(JSON.parse(stored)))
        }
    }, [])

    const persist = (set: Set<number>) => {
        localStorage.setItem("dismissedErrors", JSON.stringify([...set]))
    }

    const dismiss = (timestamp: number) => {
        const next = new Set(dismissed)
        next.add(timestamp)
        setDismissed(next)
        persist(next)
    }

    const dismissAll = () => {
        const all = new Set(lastErrors.map((e) => e.timestamp))
        setDismissed(all)
        persist(all)
    }

    const restoreAll = () => {
        setDismissed(new Set())
        localStorage.removeItem("dismissedErrors")
    }

    const visible = lastErrors
        .filter((e) => !dismissed.has(e.timestamp))
        .slice(0, visibleErrors)

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Last Errors</h2>
                {lastErrors.length > 0 && (
                    <div className="flex items-center gap-1">
                        {dismissed.size > 0 && (
                            <button
                                onClick={restoreAll}
                                title="Restore dismissed"
                                className="bg-muted/50 hover:bg-muted p-1 rounded-full text-muted-foreground hover:text-primary transition cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}
                        {visible.length > 0 && (
                            <button
                                onClick={dismissAll}
                                title="Dismiss all"
                                className="bg-muted/50 hover:bg-muted p-1 rounded-full text-muted-foreground hover:text-destructive transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {visible.map((err) => (
                        <motion.div
                            key={err.timestamp}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.25 }}
                            className={`relative p-4 bg-muted/30 border rounded-xl shadow-md transition 
              ${err.status >= 500
                                    ? "text-red-100 border-red-500/20"
                                    : "text-yellow-100 border-yellow-500/20"
                                } hover:bg-muted/40 cursor-pointer`}
                            onClick={() => onErrorSelect(err)}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    dismiss(err.timestamp)
                                }}
                                className="absolute top-2 right-2 bg-muted/40 hover:bg-muted rounded-full p-1 text-muted-foreground hover:text-destructive transition cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>

                            <div className="text-xs text-muted-foreground mb-1 font-mono">
                                {" > "} [{new Date(err.timestamp).toLocaleDateString()}{" "}
                                {new Date(err.timestamp).toLocaleTimeString()}]
                            </div>
                            <div className="text-sm text-red-500">
                                <code>{err.status}</code> – {err.url}
                            </div>
                            {err.message && (
                                <div className="text-xs text-muted-foreground italic mt-1">{err.message}</div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
