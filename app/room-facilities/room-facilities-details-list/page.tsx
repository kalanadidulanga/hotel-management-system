"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
    Image as ImageIcon,
    Settings
} from "lucide-react"

interface FacilityDetail {
    id: number
    facilityType: string
    facilityName: string
    image: string
    description?: string
}

const mockFacilityDetails: FacilityDetail[] = [
    {
        id: 1,
        facilityType: "Aroma",
        facilityName: "Air Conditioner",
        image: "/test.jpg",
        description: "High-efficiency cooling system"
    },
    {
        id: 2,
        facilityType: "Lighting",
        facilityName: "LED Ceiling Lights",
        image: "/test.jpg",
        description: "Energy-efficient LED lighting"
    },
    {
        id: 3,
        facilityType: "Entertainment",
        facilityName: "Smart TV",
        image: "/test.jpg",
        description: "55-inch 4K Smart Television"
    },
    {
        id: 4,
        facilityType: "Comfort",
        facilityName: "Premium Bedding",
        image: "/test.jpg",
        description: "Luxury cotton bedding set"
    },
    {
        id: 5,
        facilityType: "Connectivity",
        facilityName: "High-Speed WiFi",
        image: "/test.jpg",
        description: "Fiber optic internet connection"
    },
    {
        id: 6,
        facilityType: "Storage",
        facilityName: "Room Safe",
        image: "/test.jpg",
        description: "Digital security safe"
    },
    {
        id: 7,
        facilityType: "Refreshment",
        facilityName: "Mini Refrigerator",
        image: "/test.jpg",
        description: "Compact cooling unit"
    },
    {
        id: 8,
        facilityType: "Comfort",
        facilityName: "Balcony Access",
        image: "/test.jpg",
        description: "Private outdoor space"
    },
]

const facilityTypes = ["Aroma", "Lighting", "Entertainment", "Comfort", "Connectivity", "Storage", "Refreshment"]

const pageSizes = [10, 25, 50, 100]

const columns = [
    { key: "sl", label: "SL" },
    { key: "facilityType", label: "Add Facility Type" },
    { key: "facilityName", label: "Facility Name" },
    { key: "image", label: "Image" },
    { key: "action", label: "Action" },
]

export default function RoomFacilitiesDetailsListPage() {
    const [entries, setEntries] = useState(10)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<{ key: string, dir: "asc" | "desc" }>({ key: "sl", dir: "asc" })
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key))
    const [facilityDetails, setFacilityDetails] = useState<FacilityDetail[]>(mockFacilityDetails)
    const [editingFacility, setEditingFacility] = useState<FacilityDetail | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [newFacility, setNewFacility] = useState<Partial<FacilityDetail>>({
        facilityType: "",
        facilityName: "",
        image: "",
        description: ""
    })

    // Filtering
    const filtered = useMemo(() => {
        return facilityDetails.filter(facility =>
            facility.facilityType.toLowerCase().includes(search.toLowerCase()) ||
            facility.facilityName.toLowerCase().includes(search.toLowerCase())
        )
    }, [search, facilityDetails])

    // Sorting
    const sorted = useMemo(() => {
        const sortedFacilities = [...filtered]
        if (sort.key === "sl") {
            sortedFacilities.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id)
        } else if (sort.key === "facilityType") {
            sortedFacilities.sort((a, b) => {
                if (a.facilityType < b.facilityType) return sort.dir === "asc" ? -1 : 1
                if (a.facilityType > b.facilityType) return sort.dir === "asc" ? 1 : -1
                return 0
            })
        } else if (sort.key === "facilityName") {
            sortedFacilities.sort((a, b) => {
                if (a.facilityName < b.facilityName) return sort.dir === "asc" ? -1 : 1
                if (a.facilityName > b.facilityName) return sort.dir === "asc" ? 1 : -1
                return 0
            })
        }
        return sortedFacilities
    }, [filtered, sort])

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries)
    const paginated = sorted.slice((page - 1) * entries, page * entries)

    // Export/Print handlers
    const handleExport = (type: string) => {
        alert(`Export as ${type}`)
    }

    // Add facility
    const handleAddFacility = () => {
        if (newFacility.facilityType && newFacility.facilityName) {
            const facilityToAdd: FacilityDetail = {
                id: Math.max(...facilityDetails.map(f => f.id)) + 1,
                facilityType: newFacility.facilityType,
                facilityName: newFacility.facilityName,
                image: newFacility.image || "/api/placeholder/80/80",
                description: newFacility.description || ""
            }
            setFacilityDetails([...facilityDetails, facilityToAdd])
            setNewFacility({ facilityType: "", facilityName: "", image: "", description: "" })
            setIsAddModalOpen(false)
        }
    }

    // Edit facility
    const handleEdit = (facility: FacilityDetail) => {
        setEditingFacility({ ...facility })
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = () => {
        if (editingFacility) {
            setFacilityDetails(facilityDetails.map(f =>
                f.id === editingFacility.id ? editingFacility : f
            ))
            setIsEditModalOpen(false)
            setEditingFacility(null)
        }
    }

    // Delete facility
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this facility detail?")) {
            setFacilityDetails(facilityDetails.filter(f => f.id !== id))
        }
    }

    // Image upload handler
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
        const file = e.target.files?.[0]
        if (file) {
            const imageUrl = URL.createObjectURL(file)
            if (isEdit && editingFacility) {
                setEditingFacility({ ...editingFacility, image: imageUrl })
            } else {
                setNewFacility({ ...newFacility, image: imageUrl })
            }
        }
    }

    return (
        <div className="min-h-screen bg-muted">
            <div className="bg-card shadow-sm border-b">
                <div className="px-4 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Room Facilities Details List</h1>
                            <p className="text-sm text-muted-foreground mt-1">Manage detailed information about room facilities</p>
                        </div>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 flex items-center gap-2 text-sm font-medium px-4 py-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Facility Details</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4">
                {/* Controls */}
                <div className="bg-card border rounded-sm mb-4">
                    <div className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Entries */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground">Show</span>
                                <Select value={String(entries)} onValueChange={v => { setEntries(Number(v)); setPage(1) }}>
                                    <SelectTrigger className="w-20 border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pageSizes.map(size => (
                                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-foreground">entries</span>
                            </div>

                            {/* Export Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleExport("Copy")}
                                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors duration-200 text-sm"
                                >
                                    <Copy className="w-4 h-4 mr-1" />
                                    Copy
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleExport("CSV")}
                                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors duration-200 text-sm"
                                >
                                    <FileText className="w-4 h-4 mr-1" />
                                    CSV
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleExport("PDF")}
                                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors duration-200 text-sm"
                                >
                                    <FileText className="w-4 h-4 mr-1" />
                                    PDF
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleExport("Print")}
                                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors duration-200 text-sm"
                                >
                                    <Printer className="w-4 h-4 mr-1" />
                                    Print
                                </Button>
                            </div>

                            {/* Search */}
                            <div className="flex items-center gap-2 lg:ml-auto">
                                <span className="text-sm text-foreground">Search:</span>
                                <Input
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                                    className="w-48 border"
                                    placeholder="Search facilities..."
                                />
                            </div>
                        </div>

                        {/* Column Visibility */}
                        <div className="mt-4 pt-4 border-t">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const next = visibleCols.length === columns.length ?
                                        ["sl", "facilityType", "facilityName"] :
                                        columns.map(c => c.key)
                                    setVisibleCols(next)
                                }}
                                className="border hover:bg-accent transition-colors duration-200"
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                Column visibility
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border rounded-sm">
                    <div className="overflow-auto max-h-[70vh]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10">
                                <TableRow className="border-b">
                                    {columns.filter(col => visibleCols.includes(col.key)).map(col => (
                                        <TableHead
                                            key={col.key}
                                            className="text-foreground font-medium cursor-pointer select-none hover:bg-accent transition-colors duration-200 border-b"
                                            onClick={() => {
                                                if (col.key !== "image" && col.key !== "action") {
                                                    setSort(s => ({
                                                        key: col.key,
                                                        dir: s.key === col.key ? (s.dir === "asc" ? "desc" : "asc") : "asc"
                                                    }))
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.label}
                                                {(col.key === "sl" || col.key === "facilityType" || col.key === "facilityName") && (
                                                    <div className="flex flex-col">
                                                        {sort.key === col.key ? (
                                                            sort.dir === "asc" ?
                                                                <ChevronUp className="w-4 h-4 text-foreground" /> :
                                                                <ChevronDown className="w-4 h-4 text-foreground" />
                                                        ) : (
                                                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
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
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-8 border-b">
                                            <div className="flex flex-col items-center gap-2">
                                                <Settings className="w-8 h-8 text-muted-foreground" />
                                                <p className="text-muted-foreground">No facility details found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map((facility, idx) => (
                                    <TableRow key={facility.id} className="hover:bg-accent transition-colors duration-200 border-b">
                                        {visibleCols.includes("sl") && (
                                            <TableCell className="text-foreground border-b">
                                                {(page - 1) * entries + idx + 1}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("facilityType") && (
                                            <TableCell className="text-foreground border-b">
                                                <div className="flex items-center gap-2">
                                                    <Settings className="w-4 h-4 text-muted-foreground" />
                                                    {facility.facilityType}
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("facilityName") && (
                                            <TableCell className="border-b">
                                                <div className="text-foreground font-medium">{facility.facilityName}</div>
                                                {facility.description && (
                                                    <div className="text-sm text-muted-foreground mt-1">{facility.description}</div>
                                                )}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("image") && (
                                            <TableCell className="border-b">
                                                <div className="w-12 h-12 border rounded overflow-hidden">
                                                    <img
                                                        src={facility.image}
                                                        alt={facility.facilityName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/api/placeholder/80/80";
                                                        }}
                                                    />
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("action") && (
                                            <TableCell className="border-b">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(facility)}
                                                        className="p-2 hover:bg-accent transition-colors duration-200 border rounded"
                                                    >
                                                        <Pencil className="w-4 h-4 text-muted-foreground" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(facility.id)}
                                                        className="p-2 hover:bg-accent transition-colors duration-200 border rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="bg-card border rounded-sm mt-4">
                    <div className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {(page - 1) * entries + 1} to {Math.min(page * entries, sorted.length)} of {sorted.length} entries
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="border hover:bg-accent transition-colors duration-200"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </Button>
                                <span className="text-sm text-foreground">
                                    Page {page} of {totalPages || 1}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === totalPages || totalPages === 0}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="border hover:bg-accent transition-colors duration-200"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px] border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Add New Facility Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-foreground">Facility Type</Label>
                                <Select value={newFacility.facilityType} onValueChange={(value) => setNewFacility({ ...newFacility, facilityType: value })}>
                                    <SelectTrigger className="border">
                                        <SelectValue placeholder="Select facility type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {facilityTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-foreground">Facility Name</Label>
                                <Input
                                    value={newFacility.facilityName}
                                    onChange={(e) => setNewFacility({ ...newFacility, facilityName: e.target.value })}
                                    placeholder="Enter facility name..."
                                    className="border"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-foreground">Description</Label>
                            <Textarea
                                value={newFacility.description}
                                onChange={(e) => setNewFacility({ ...newFacility, description: e.target.value })}
                                placeholder="Enter facility description..."
                                className="border"
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label className="text-foreground">Facility Image</Label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 border rounded overflow-hidden flex items-center justify-center bg-muted">
                                    {newFacility.image ? (
                                        <img
                                            src={newFacility.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e)}
                                        className="border"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">Upload an image for this facility</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddModalOpen(false)
                                    setNewFacility({ facilityType: "", facilityName: "", image: "", description: "" })
                                }}
                                className="border hover:bg-accent transition-colors duration-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddFacility}
                                disabled={!newFacility.facilityType || !newFacility.facilityName}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
                            >
                                Add Facility Details
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Edit Facility Details</DialogTitle>
                    </DialogHeader>
                    {editingFacility && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-foreground">Facility Type</Label>
                                    <Select value={editingFacility.facilityType} onValueChange={(value) => setEditingFacility({ ...editingFacility, facilityType: value })}>
                                        <SelectTrigger className="border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {facilityTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-foreground">Facility Name</Label>
                                    <Input
                                        value={editingFacility.facilityName}
                                        onChange={(e) => setEditingFacility({ ...editingFacility, facilityName: e.target.value })}
                                        className="border"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-foreground">Description</Label>
                                <Textarea
                                    value={editingFacility.description}
                                    onChange={(e) => setEditingFacility({ ...editingFacility, description: e.target.value })}
                                    className="border"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label className="text-foreground">Facility Image</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 border rounded overflow-hidden flex items-center justify-center bg-muted">
                                        {editingFacility.image ? (
                                            <img
                                                src={editingFacility.image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, true)}
                                            className="border"
                                        />
                                        <p className="text-sm text-muted-foreground mt-1">Upload a new image or keep current one</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="border hover:bg-accent transition-colors duration-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
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