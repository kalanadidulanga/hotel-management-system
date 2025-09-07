"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ConfirmDialogProps {
    title: string;
    description?: string;
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({ title, description, isOpen, onConfirm, onCancel }: ConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <p className="text-sm text-gray-500">{description}</p>}
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onConfirm}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
