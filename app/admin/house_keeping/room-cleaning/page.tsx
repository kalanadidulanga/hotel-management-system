"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Copy, FileText, Printer, Eye, Calendar, User, Building, Plus } from "lucide-react"

type CleaningStatus = "Under Process" | "Completed" | "Pending"

interface CleaningRow {
    id: number
    employeeId: string
    name: string
    roomNo: string
    date: string
    status: CleaningStatus
}

const mockData: CleaningRow[] = [
    { id: 1, employeeId: "EMP001", name: "Sarah Johnson", roomNo: "101", date: "2025-07-15", status: "Under Process" },
    { id: 2, employeeId: "EMP002", name: "Mike Chen", roomNo: "102", date: "2025-07-15", status: "Completed" },
    { id: 3, employeeId: "EMP003", name: "James Wilson", roomNo: "103", date: "2025-07-15", status: "Pending" },
    { id: 4, employeeId: "EMP004", name: "Emily Smith", roomNo: "104", date: "2025-07-15", status: "Completed" },
    { id: 5, employeeId: "EMP005", name: "John Doe", roomNo: "105", date: "2025-07-15", status: "Under Process" },
    { id: 6, employeeId: "EMP006", name: "Alice Brown", roomNo: "106", date: "2025-07-15", status: "Pending" },
    { id: 7, employeeId: "EMP007", name: "Bob Wilson", roomNo: "107", date: "2025-07-15", status: "Completed" },
    { id: 8, employeeId: "EMP008", name: "Carol Davis", roomNo: "108", date: "2025-07-15", status: "Under Process" },
]

const statusColor = {
    "Under Process": "bg-amber-100 text-amber-800",
    "Completed": "bg-emerald-100 text-emerald-800",
    "Pending": "bg-slate-100 text-slate-800",
}

const pageSizes = [10, 25, 50, 100]

const columns = [
    { key: "sl", label: "SL" },
    { key: "employeeId", label: "Employee ID" },
    { key: "name", label: "Name" },
    { key: "roomNo", label: "Room No." },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "action", label: "Actions" },
]

export default function RoomCleaningPage() {
    const [entries, setEntries] = useState(10)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<{ key: keyof CleaningRow | "sl", dir: "asc" | "desc" }>({ key: "sl", dir: "asc" })
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key))
    const [editingRow, setEditingRow] = useState<CleaningRow | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    // Filtering
    const filtered = useMemo(() => {
        return mockData.filter(row =>
            row.employeeId.toLowerCase().includes(search.toLowerCase()) ||
            row.name.toLowerCase().includes(search.toLowerCase()) ||
            row.roomNo.toLowerCase().includes(search.toLowerCase()) ||
            row.status.toLowerCase().includes(search.toLowerCase())
        )
    }, [search])

    // Sorting
    const sorted = useMemo(() => {
        const sortedRows = [...filtered]
        if (sort.key === "sl") {
            sortedRows.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id)
        } else {
            sortedRows.sort((a, b) => {
                const aVal = a[sort.key as keyof CleaningRow]
                const bVal = b[sort.key as keyof CleaningRow]
                if (aVal < bVal) return sort.dir === "asc" ? -1 : 1
                if (aVal > bVal) return sort.dir === "asc" ? 1 : -1
                return 0
            })
        }
        return sortedRows
    }, [filtered, sort])

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries)
    const paginated = sorted.slice((page - 1) * entries, page * entries)

    // Column visibility
    const toggleCol = (key: string) => {
        setVisibleCols(cols =>
            cols.includes(key) ? cols.filter(c => c !== key) : [...cols, key]
        )
    }

    // Export/Print handlers (stub)
    const handleExport = (type: string) => {
        alert(`Export as ${type} (stub)`)
    }

    // Edit handlers
    const handleEdit = (row: CleaningRow) => {
        setEditingRow({ ...row })
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = () => {
        if (editingRow) {
            // Here you would typically save to backend
            console.log("Saving:", editingRow)
            setIsEditModalOpen(false)
            setEditingRow(null)
        }
    }

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this record?")) {
            // Here you would typically delete from backend
            console.log("Deleting:", id)
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Room Cleaning</h1>
                    <p className="text-gray-600 mt-1">Manage room cleaning assignments and track progress</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Assignment
                </Button>
            </div>

            {/* Controls Card */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Left: Entries */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="entries" className="text-sm font-medium text-gray-700">Show</label>
                            <Select value={String(entries)} onValueChange={v => { setEntries(Number(v)); setPage(1) }}>
                                <SelectTrigger id="entries" className="w-24 border-0 bg-gray-50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizes.map(size => (
                                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-gray-600">entries</span>
                        </div>

                        {/* Center: Export Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" className="text-green-700 border-0 bg-green-50 hover:bg-green-100" onClick={() => handleExport("Copy")}>
                                <Copy className="h-4 w-4 mr-1" /> Copy
                            </Button>
                            <Button size="sm" variant="outline" className="text-green-700 border-0 bg-green-50 hover:bg-green-100" onClick={() => handleExport("CSV")}>
                                <FileText className="h-4 w-4 mr-1" /> CSV
                            </Button>
                            <Button size="sm" variant="outline" className="text-green-700 border-0 bg-green-50 hover:bg-green-100" onClick={() => handleExport("PDF")}>
                                <FileText className="h-4 w-4 mr-1" /> PDF
                            </Button>
                            <Button size="sm" variant="outline" className="text-green-700 border-0 bg-green-50 hover:bg-green-100" onClick={() => handleExport("Print")}>
                                <Printer className="h-4 w-4 mr-1" /> Print
                            </Button>
                        </div>

                        {/* Right: Search */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="search" className="text-sm font-medium text-gray-700">Search:</label>
                            <Input
                                id="search"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1) }}
                                className="w-64 border-0 bg-gray-50"
                                placeholder="Search employees, rooms, status..."
                            />
                        </div>
                    </div>

                    {/* Column Visibility */}
                    <div className="mt-4 pt-4">
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-700 border-0 bg-blue-50 hover:bg-blue-100"
                            onClick={() => {
                                const next = visibleCols.length === columns.length ? ["sl", "employeeId", "name"] : columns.map(c => c.key)
                                setVisibleCols(next)
                            }}
                        >
                            <Eye className="h-4 w-4 mr-1" /> Column Visibility
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Enhanced Table */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 border-0">
                                    {columns.filter(col => visibleCols.includes(col.key)).map(col => (
                                        <TableHead
                                            key={col.key}
                                            className="font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/50 transition-colors border-0"
                                            onClick={() => setSort(s => ({
                                                key: col.key as any,
                                                dir: s.key === col.key ? (s.dir === "asc" ? "desc" : "asc") : "asc"
                                            }))}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.label}
                                                <div className="flex flex-col">
                                                    {sort.key === col.key ? (
                                                        sort.dir === "asc" ?
                                                            <ChevronUp className="h-4 w-4 text-blue-600" /> :
                                                            <ChevronDown className="h-4 w-4 text-blue-600" />
                                                    ) : (
                                                        <ChevronUp className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.length === 0 ? (
                                    <TableRow className="border-0">
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12 border-0">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <FileText className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <p className="text-gray-500 font-medium">No data found</p>
                                                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map((row, idx) => (
                                    <TableRow key={row.id} className="hover:bg-gray-50/50 transition-colors border-0">
                                        {visibleCols.includes("sl") && (
                                            <TableCell className="font-medium text-gray-900 border-0">
                                                {(page - 1) * entries + idx + 1}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("employeeId") && (
                                            <TableCell className="border-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{row.employeeId}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("name") && (
                                            <TableCell className="border-0">
                                                <div className="font-medium text-gray-900">{row.name}</div>
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("roomNo") && (
                                            <TableCell className="border-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                        <Building className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{row.roomNo}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("date") && (
                                            <TableCell className="border-0">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">{row.date}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("status") && (
                                            <TableCell className="border-0">
                                                <Badge className={`${statusColor[row.status]} font-medium border-0`}>
                                                    {row.status}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("action") && (
                                            <TableCell className="border-0">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                        onClick={() => handleEdit(row)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => handleDelete(row.id)}
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

            {/* Enhanced Pagination */}
            <Card className="border-0 shadow-sm">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-medium">{(page - 1) * entries + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(page * entries, sorted.length)}</span> of{' '}
                            <span className="font-medium">{sorted.length}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage(1)}
                                className="px-3 border-0 bg-gray-50 hover:bg-gray-100"
                            >
                                First
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="border-0 bg-gray-50 hover:bg-gray-100"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">Page</span>
                                <span className="font-medium">{page}</span>
                                <span className="text-sm text-gray-600">of</span>
                                <span className="font-medium">{totalPages || 1}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === totalPages || totalPages === 0}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="border-0 bg-gray-50 hover:bg-gray-100"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === totalPages || totalPages === 0}
                                onClick={() => setPage(totalPages)}
                                className="px-3 border-0 bg-gray-50 hover:bg-gray-100"
                            >
                                Last
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-blue-600" />
                            Edit Room Cleaning Assignment
                        </DialogTitle>
                    </DialogHeader>
                    {editingRow && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employeeId">Employee ID</Label>
                                    <Input
                                        id="employeeId"
                                        value={editingRow.employeeId}
                                        onChange={(e) => setEditingRow({ ...editingRow, employeeId: e.target.value })}
                                        className="font-medium border-0 bg-gray-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roomNo">Room Number</Label>
                                    <Input
                                        id="roomNo"
                                        value={editingRow.roomNo}
                                        onChange={(e) => setEditingRow({ ...editingRow, roomNo: e.target.value })}
                                        className="font-medium border-0 bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Employee Name</Label>
                                <Input
                                    id="name"
                                    value={editingRow.name}
                                    onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                                    className="font-medium border-0 bg-gray-50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={editingRow.date}
                                        onChange={(e) => setEditingRow({ ...editingRow, date: e.target.value })}
                                        className="border-0 bg-gray-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={editingRow.status}
                                        onValueChange={(value: CleaningStatus) => setEditingRow({ ...editingRow, status: value })}
                                    >
                                        <SelectTrigger className="border-0 bg-gray-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Under Process">Under Process</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-0 bg-gray-50 hover:bg-gray-100">
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
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