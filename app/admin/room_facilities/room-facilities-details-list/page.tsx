"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
    Upload,
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
        image: "/api/placeholder/80/80",
        description: "High-efficiency cooling system"
    },
    {
        id: 2,
        facilityType: "Lighting",
        facilityName: "LED Ceiling Lights",
        image: "/api/placeholder/80/80",
        description: "Energy-efficient LED lighting"
    },
    {
        id: 3,
        facilityType: "Entertainment",
        facilityName: "Smart TV",
        image: "/api/placeholder/80/80",
        description: "55-inch 4K Smart Television"
    },
    {
        id: 4,
        facilityType: "Comfort",
        facilityName: "Premium Bedding",
        image: "/api/placeholder/80/80",
        description: "Luxury cotton bedding set"
    },
    {
        id: 5,
        facilityType: "Connectivity",
        facilityName: "High-Speed WiFi",
        image: "/api/placeholder/80/80",
        description: "Fiber optic internet connection"
    },
    {
        id: 6,
        facilityType: "Storage",
        facilityName: "Room Safe",
        image: "/api/placeholder/80/80",
        description: "Digital security safe"
    },
    {
        id: 7,
        facilityType: "Refreshment",
        facilityName: "Mini Refrigerator",
        image: "/api/placeholder/80/80",
        description: "Compact cooling unit"
    },
    {
        id: 8,
        facilityType: "Comfort",
        facilityName: "Balcony Access",
        image: "/api/placeholder/80/80",
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

    // Export/Print handlers (stub)
    const handleExport = (type: string) => {
        alert(`Export as ${type} (stub)`)
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

    // Image upload handler (stub)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
        const file = e.target.files?.[0]
        if (file) {
            // In a real app, you'd upload to a server and get back a URL
            const imageUrl = URL.createObjectURL(file)
            if (isEdit && editingFacility) {
                setEditingFacility({ ...editingFacility, image: imageUrl })
            } else {
                setNewFacility({ ...newFacility, image: imageUrl })
            }
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Room Facilities Details List</h1>
                    <p className="text-gray-600 mt-1">Manage detailed information about room facilities</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Facility Details
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
                                placeholder="Search facilities..."
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
                                const next = visibleCols.length === columns.length ? ["sl", "facilityType", "facilityName"] : columns.map(c => c.key)
                                setVisibleCols(next)
                            }}
                        >
                            <Eye className="h-4 w-4 mr-1" /> Column visibility
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Facilities Details Table */}
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
                                                                <ChevronUp className="h-4 w-4 text-blue-600" /> :
                                                                <ChevronDown className="h-4 w-4 text-blue-600" />
                                                        ) : (
                                                            <ChevronUp className="h-4 w-4 text-gray-400" />
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
                                    <TableRow className="border-0">
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12 border-0">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <Settings className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <p className="text-gray-500 font-medium">No facility details found</p>
                                                <p className="text-gray-400 text-sm">Try adjusting your search or add new facility details</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map((facility, idx) => (
                                    <TableRow key={facility.id} className="hover:bg-gray-50/50 transition-colors border-0">
                                        {visibleCols.includes("sl") && (
                                            <TableCell className="font-medium text-gray-900 border-0">
                                                {(page - 1) * entries + idx + 1}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("facilityType") && (
                                            <TableCell className="border-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Settings className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{facility.facilityType}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("facilityName") && (
                                            <TableCell className="border-0">
                                                <div className="font-medium text-gray-900">{facility.facilityName}</div>
                                                {facility.description && (
                                                    <div className="text-sm text-gray-500 mt-1">{facility.description}</div>
                                                )}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("image") && (
                                            <TableCell className="border-0">
                                                <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden">
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
                                            <TableCell className="border-0">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                        onClick={() => handleEdit(facility)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => handleDelete(facility.id)}
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
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="border-0 bg-gray-50 hover:bg-gray-100"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
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
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add Facility Details Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px] border-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-blue-600" />
                            Add New Facility Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="facilityType">Facility Type</Label>
                                <Select value={newFacility.facilityType} onValueChange={(value) => setNewFacility({ ...newFacility, facilityType: value })}>
                                    <SelectTrigger className="border-0 bg-gray-50">
                                        <SelectValue placeholder="Select facility type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {facilityTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="facilityName">Facility Name</Label>
                                <Input
                                    id="facilityName"
                                    value={newFacility.facilityName}
                                    onChange={(e) => setNewFacility({ ...newFacility, facilityName: e.target.value })}
                                    placeholder="Enter facility name..."
                                    className="border-0 bg-gray-50"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={newFacility.description}
                                onChange={(e) => setNewFacility({ ...newFacility, description: e.target.value })}
                                placeholder="Enter facility description..."
                                className="border-0 bg-gray-50"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">Facility Image</Label>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                    {newFacility.image ? (
                                        <img
                                            src={newFacility.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e)}
                                        className="border-0 bg-gray-50"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Upload an image for this facility</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddModalOpen(false)
                                    setNewFacility({ facilityType: "", facilityName: "", image: "", description: "" })
                                }}
                                className="border-0 bg-gray-50 hover:bg-gray-100"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddFacility}
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={!newFacility.facilityType || !newFacility.facilityName}
                            >
                                Add Facility Details
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Facility Details Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px] border-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-blue-600" />
                            Edit Facility Details
                        </DialogTitle>
                    </DialogHeader>
                    {editingFacility && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="editFacilityType">Facility Type</Label>
                                    <Select value={editingFacility.facilityType} onValueChange={(value) => setEditingFacility({ ...editingFacility, facilityType: value })}>
                                        <SelectTrigger className="border-0 bg-gray-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {facilityTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="editFacilityName">Facility Name</Label>
                                    <Input
                                        id="editFacilityName"
                                        value={editingFacility.facilityName}
                                        onChange={(e) => setEditingFacility({ ...editingFacility, facilityName: e.target.value })}
                                        className="border-0 bg-gray-50"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="editDescription">Description</Label>
                                <Textarea
                                    id="editDescription"
                                    value={editingFacility.description}
                                    onChange={(e) => setEditingFacility({ ...editingFacility, description: e.target.value })}
                                    className="border-0 bg-gray-50"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editImage">Facility Image</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                        {editingFacility.image ? (
                                            <img
                                                src={editingFacility.image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, true)}
                                            className="border-0 bg-gray-50"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Upload a new image or keep current one</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="border-0 bg-gray-50 hover:bg-gray-100"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    className="bg-blue-600 hover:bg-blue-700"
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