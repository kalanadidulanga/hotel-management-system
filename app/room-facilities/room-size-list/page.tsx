"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Copy,
    FileText,
    Printer,
    Eye,
    Plus,
    Settings,
    Home,
    Bed,
    Users
} from "lucide-react"

interface RoomSize {
    id: number
    name: string
}

const mockRoomSizes: RoomSize[] = [
    { id: 1, name: "Executive Suite" },
    { id: 2, name: "Double-Double" },
    { id: 3, name: "Twin" },
    { id: 4, name: "King" },
    { id: 5, name: "Queen" },
    { id: 6, name: "Quad" },
    { id: 7, name: "Triple" },
    { id: 8, name: "Double" },
    { id: 9, name: "Single" },
    { id: 10, name: "Deluxe Suite" },
    { id: 11, name: "Presidential Suite" },
    { id: 12, name: "Junior Suite" },
]

const pageSizes = [10, 25, 50, 100]

const columns = [
    { key: "sl", label: "SL" },
    { key: "roomSize", label: "Room Size" },
    { key: "action", label: "Action" },
]

export default function RoomSizeListPage() {
    const [entries, setEntries] = useState(10)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<{ key: string, dir: "asc" | "desc" }>({ key: "sl", dir: "asc" })
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key))
    const [roomSizes, setRoomSizes] = useState<RoomSize[]>(mockRoomSizes)
    const [editingRoomSize, setEditingRoomSize] = useState<RoomSize | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [newRoomSizeName, setNewRoomSizeName] = useState("")

    // Filtering
    const filtered = useMemo(() => {
        return roomSizes.filter(roomSize =>
            roomSize.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [search, roomSizes])

    // Sorting
    const sorted = useMemo(() => {
        const sortedRoomSizes = [...filtered]
        if (sort.key === "sl") {
            sortedRoomSizes.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id)
        } else if (sort.key === "roomSize") {
            sortedRoomSizes.sort((a, b) => {
                if (a.name < b.name) return sort.dir === "asc" ? -1 : 1
                if (a.name > b.name) return sort.dir === "asc" ? 1 : -1
                return 0
            })
        }
        return sortedRoomSizes
    }, [filtered, sort])

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries)
    const paginated = sorted.slice((page - 1) * entries, page * entries)

    // Export/Print handlers
    const handleExport = (type: string) => {
        alert(`Export as ${type}`)
    }

    // Add room size
    const handleAddRoomSize = () => {
        if (newRoomSizeName.trim()) {
            const newRoomSize: RoomSize = {
                id: Math.max(...roomSizes.map(r => r.id)) + 1,
                name: newRoomSizeName.trim()
            }
            setRoomSizes([...roomSizes, newRoomSize])
            setNewRoomSizeName("")
            setIsAddModalOpen(false)
        }
    }

    // Edit room size
    const handleEdit = (roomSize: RoomSize) => {
        setEditingRoomSize({ ...roomSize })
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = () => {
        if (editingRoomSize) {
            setRoomSizes(roomSizes.map(r =>
                r.id === editingRoomSize.id ? editingRoomSize : r
            ))
            setIsEditModalOpen(false)
            setEditingRoomSize(null)
        }
    }

    // Delete room size
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this room size?")) {
            setRoomSizes(roomSizes.filter(r => r.id !== id))
        }
    }

    // Get room size icon
    const getRoomSizeIcon = (name: string) => {
        const lowerName = name.toLowerCase()
        if (lowerName.includes('suite')) return <Home className="h-4 w-4 text-primary" />
        if (lowerName.includes('king') || lowerName.includes('queen')) return <Bed className="h-4 w-4 text-chart-2" />
        if (lowerName.includes('triple') || lowerName.includes('quad')) return <Users className="h-4 w-4 text-chart-4" />
        if (lowerName.includes('double') || lowerName.includes('twin')) return <Bed className="h-4 w-4 text-chart-3" />
        return <Settings className="h-4 w-4 text-muted-foreground" />
    }

    return (
        <div className="p-6 space-y-6 bg-background">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Room Size List</h1>
                    <p className="text-muted-foreground mt-1">Manage room size categories and types</p>
                </div>
                <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Room Size Name
                </Button>
            </div>

            {/* Controls Card */}
            <Card className="border-border">
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Left: Entries */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="entries" className="text-sm font-medium text-foreground">Show</label>
                            <Select value={String(entries)} onValueChange={v => { setEntries(Number(v)); setPage(1) }}>
                                <SelectTrigger id="entries" className="w-24 border-border bg-muted">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizes.map(size => (
                                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">entries</span>
                        </div>

                        {/* Center: Export Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" className="text-secondary-foreground border-border bg-secondary hover:bg-secondary/90" onClick={() => handleExport("Copy")}>
                                <Copy className="h-4 w-4 mr-1" /> Copy
                            </Button>
                            <Button size="sm" variant="outline" className="text-secondary-foreground border-border bg-secondary hover:bg-secondary/90" onClick={() => handleExport("CSV")}>
                                <FileText className="h-4 w-4 mr-1" /> CSV
                            </Button>
                            <Button size="sm" variant="outline" className="text-secondary-foreground border-border bg-secondary hover:bg-secondary/90" onClick={() => handleExport("PDF")}>
                                <FileText className="h-4 w-4 mr-1" /> PDF
                            </Button>
                            <Button size="sm" variant="outline" className="text-secondary-foreground border-border bg-secondary hover:bg-secondary/90" onClick={() => handleExport("Print")}>
                                <Printer className="h-4 w-4 mr-1" /> Print
                            </Button>
                        </div>

                        {/* Right: Search */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="search" className="text-sm font-medium text-foreground">Search:</label>
                            <Input
                                id="search"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1) }}
                                className="w-64 border-border bg-muted"
                                placeholder="Search room sizes..."
                            />
                        </div>
                    </div>

                    {/* Column Visibility */}
                    <div className="mt-4 pt-4 border-t border-border">
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-accent-foreground border-border bg-accent hover:bg-accent/80"
                            onClick={() => {
                                const next = visibleCols.length === columns.length ? ["sl", "roomSize"] : columns.map(c => c.key)
                                setVisibleCols(next)
                            }}
                        >
                            <Eye className="h-4 w-4 mr-1" /> Column visibility
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Room Sizes Table */}
            <Card className="border-border">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 border-border">
                                    {columns.filter(col => visibleCols.includes(col.key)).map(col => (
                                        <TableHead
                                            key={col.key}
                                            className="font-semibold text-foreground cursor-pointer select-none hover:bg-accent/50 transition-colors border-border"
                                            onClick={() => {
                                                if (col.key !== "action") {
                                                    setSort(s => ({
                                                        key: col.key,
                                                        dir: s.key === col.key ? (s.dir === "asc" ? "desc" : "asc") : "asc"
                                                    }))
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.label}
                                                {(col.key === "sl" || col.key === "roomSize") && (
                                                    <div className="flex flex-col">
                                                        {sort.key === col.key ? (
                                                            sort.dir === "asc" ?
                                                                <ChevronUp className="h-4 w-4 text-primary" /> :
                                                                <ChevronDown className="h-4 w-4 text-primary" />
                                                        ) : (
                                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.length === 0 ? (
                                    <TableRow className="border-border">
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12 border-border">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                                                    <Settings className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">No room sizes found</p>
                                                <p className="text-muted-foreground text-sm">Try adjusting your search or add new room sizes</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map((roomSize, idx) => (
                                    <TableRow key={roomSize.id} className="hover:bg-muted/50 transition-colors border-border">
                                        {visibleCols.includes("sl") && (
                                            <TableCell className="font-medium text-foreground border-border">
                                                {(page - 1) * entries + idx + 1}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("roomSize") && (
                                            <TableCell className="border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                                                        {getRoomSizeIcon(roomSize.name)}
                                                    </div>
                                                    <span className="font-medium text-foreground">{roomSize.name}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("action") && (
                                            <TableCell className="border-border">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-primary hover:bg-primary/10 hover:text-primary"
                                                        onClick={() => handleEdit(roomSize)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => handleDelete(roomSize.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <Card className="border-border">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{(page - 1) * entries + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(page * entries, sorted.length)}</span> of{' '}
                            <span className="font-medium">{sorted.length}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="border-border bg-muted hover:bg-accent"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">Page</span>
                                <span className="font-medium text-foreground">{page}</span>
                                <span className="text-sm text-muted-foreground">of</span>
                                <span className="font-medium text-foreground">{totalPages || 1}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === totalPages || totalPages === 0}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="border-border bg-muted hover:bg-accent"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add Room Size Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <Plus className="h-5 w-5 text-primary" />
                            Add New Room Size
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="roomSizeName" className="text-foreground">Room Size Name</Label>
                            <Input
                                id="roomSizeName"
                                value={newRoomSizeName}
                                onChange={(e) => setNewRoomSizeName(e.target.value)}
                                placeholder="Enter room size name..."
                                className="border-border bg-muted"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddModalOpen(false)
                                    setNewRoomSizeName("")
                                }}
                                className="border-border bg-muted hover:bg-accent"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddRoomSize}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                disabled={!newRoomSizeName.trim()}
                            >
                                Add Room Size
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Room Size Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <Pencil className="h-5 w-5 text-primary" />
                            Edit Room Size
                        </DialogTitle>
                    </DialogHeader>
                    {editingRoomSize && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="editRoomSizeName" className="text-foreground">Room Size Name</Label>
                                <Input
                                    id="editRoomSizeName"
                                    value={editingRoomSize.name}
                                    onChange={(e) => setEditingRoomSize({ ...editingRoomSize, name: e.target.value })}
                                    className="border-border bg-muted"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="border-border bg-muted hover:bg-accent"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}