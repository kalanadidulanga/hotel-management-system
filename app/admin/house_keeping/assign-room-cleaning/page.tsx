"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Users, Home, Save, Search } from "lucide-react"

interface HouseKeeper {
    id: string
    name: string
    isAvailable: boolean
}

interface Room {
    id: string
    number: string
    type: 'Single' | 'Double' | 'Triple' | 'VIP' | 'Deluxe'
    status: 'Ready' | 'Assigned to Clean' | 'Under Process'
    floor: number
}

export default function AssignRoomCleaningPage() {
    const [selectedHouseKeeper, setSelectedHouseKeeper] = useState<string>("")
    const [rooms, setRooms] = useState<Room[]>([])
    const [houseKeepers, setHouseKeepers] = useState<HouseKeeper[]>([])
    const [selectedRooms, setSelectedRooms] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    // Load data
    useEffect(() => {
        const mockHouseKeepers: HouseKeeper[] = [
            { id: "1", name: "Sarah Johnson", isAvailable: true },
            { id: "2", name: "Mike Chen", isAvailable: true },
            { id: "3", name: "James Wilson", isAvailable: true },
        ]

        const mockRooms: Room[] = [
            { id: "1", number: "100", type: "Single", status: "Ready", floor: 1 },
            { id: "2", number: "101", type: "Double", status: "Ready", floor: 1 },
            { id: "3", number: "102", type: "Triple", status: "Under Process", floor: 1 },
            { id: "4", number: "103", type: "VIP", status: "Assigned to Clean", floor: 1 },
            { id: "5", number: "104", type: "Deluxe", status: "Ready", floor: 1 },
            { id: "6", number: "105", type: "Single", status: "Ready", floor: 1 },
            { id: "7", number: "106", type: "Double", status: "Under Process", floor: 1 },
            { id: "8", number: "107", type: "Triple", status: "Ready", floor: 1 },
            { id: "9", number: "200", type: "Single", status: "Ready", floor: 2 },
            { id: "10", number: "201", type: "Double", status: "Ready", floor: 2 },
            { id: "11", number: "202", type: "VIP", status: "Assigned to Clean", floor: 2 },
            { id: "12", number: "203", type: "Deluxe", status: "Ready", floor: 2 },
            { id: "13", number: "204", type: "Single", status: "Under Process", floor: 2 },
            { id: "14", number: "205", type: "Double", status: "Ready", floor: 2 },
            { id: "15", number: "206", type: "Triple", status: "Ready", floor: 2 },
            { id: "16", number: "207", type: "VIP", status: "Ready", floor: 2 },
            { id: "17", number: "300", type: "Single", status: "Ready", floor: 3 },
            { id: "18", number: "301", type: "Double", status: "Ready", floor: 3 },
            { id: "19", number: "302", type: "Deluxe", status: "Under Process", floor: 3 },
            { id: "20", number: "303", type: "VIP", status: "Ready", floor: 3 },
        ]

        setHouseKeepers(mockHouseKeepers)
        setRooms(mockRooms)
    }, [])

    const handleRoomSelection = (roomId: string, checked: boolean) => {
        if (checked) {
            setSelectedRooms([...selectedRooms, roomId])
        } else {
            setSelectedRooms(selectedRooms.filter(id => id !== roomId))
        }
    }

    const handleAssign = () => {
        if (!selectedHouseKeeper || selectedRooms.length === 0) {
            alert("Please select a housekeeper and at least one room")
            return
        }

        // Update room status
        setRooms(rooms.map(room =>
            selectedRooms.includes(room.id)
                ? { ...room, status: "Assigned to Clean" as const }
                : room
        ))

        // Clear selections
        setSelectedRooms([])
        setSelectedHouseKeeper("")

        alert(`Successfully assigned ${selectedRooms.length} room(s)!`)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Ready": return "bg-green-100 text-green-800 border-green-200"
            case "Assigned to Clean": return "bg-blue-100 text-blue-800 border-blue-200"
            case "Under Process": return "bg-yellow-100 text-yellow-800 border-yellow-200"
            default: return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getRoomTypeColor = (type: string) => {
        switch (type) {
            case "VIP": return "bg-purple-100 text-purple-800 border-purple-200"
            case "Deluxe": return "bg-orange-100 text-orange-800 border-orange-200"
            case "Triple": return "bg-blue-100 text-blue-800 border-blue-200"
            case "Double": return "bg-green-100 text-green-800 border-green-200"
            case "Single": return "bg-gray-100 text-gray-800 border-gray-200"
            default: return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    // Filter rooms based on search and filters
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.type.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = roomTypeFilter === "all" || room.type === roomTypeFilter
        const matchesStatus = statusFilter === "all" || room.status === statusFilter

        return matchesSearch && matchesType && matchesStatus
    })

    const availableRooms = filteredRooms.filter(room => room.status === "Ready")

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        Assign Room Cleaning
                    </h1>
                    <p className="text-gray-600 mt-1">Select rooms and assign them to housekeepers</p>
                </div>

                {/* Controls Section */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    {/* Housekeeper Selection */}
                    <div className="mb-6">
                        <Label htmlFor="housekeeper" className="text-sm font-medium mb-2 block">
                            Select House Keeper *
                        </Label>
                        <Select value={selectedHouseKeeper} onValueChange={setSelectedHouseKeeper}>
                            <SelectTrigger className="w-full max-w-md">
                                <SelectValue placeholder="Choose a housekeeper" />
                            </SelectTrigger>
                            <SelectContent>
                                {houseKeepers.map(hk => (
                                    <SelectItem key={hk.id} value={hk.id}>
                                        {hk.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search and Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                                Search Room
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search"
                                    placeholder="Search by room number or type..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="roomType" className="text-sm font-medium mb-2 block">
                                Room Type
                            </Label>
                            <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                                <SelectTrigger id="roomType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Single">Single</SelectItem>
                                    <SelectItem value="Double">Double</SelectItem>
                                    <SelectItem value="Triple">Triple</SelectItem>
                                    <SelectItem value="VIP">VIP</SelectItem>
                                    <SelectItem value="Deluxe">Deluxe</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                                Status
                            </Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Ready">Ready</SelectItem>
                                    <SelectItem value="Assigned to Clean">Assigned to Clean</SelectItem>
                                    <SelectItem value="Under Process">Under Process</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            {availableRooms.length} rooms available • {selectedRooms.length} selected
                        </p>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedHouseKeeper || selectedRooms.length === 0}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Assign Rooms ({selectedRooms.length})
                        </Button>
                    </div>
                </div>

                {/* Room Grid - Bigger Cards */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {filteredRooms.map(room => (
                            <div
                                key={room.id}
                                className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 rounded-lg p-4 ${selectedRooms.includes(room.id)
                                        ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md'
                                        : 'bg-white border border-gray-200 hover:border-gray-300'
                                    } ${room.status !== 'Ready' ? 'opacity-60' : ''
                                    }`}
                                onClick={() => {
                                    if (room.status === 'Ready') {
                                        handleRoomSelection(room.id, !selectedRooms.includes(room.id))
                                    }
                                }}
                            >
                                <div className="flex flex-col h-24">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Home className="h-4 w-4 text-gray-500" />
                                            <span className="font-semibold text-sm">{room.number}</span>
                                        </div>
                                        <Checkbox
                                            checked={selectedRooms.includes(room.id)}
                                            onCheckedChange={(checked) =>
                                                handleRoomSelection(room.id, checked as boolean)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={room.status !== 'Ready'}
                                            className="h-4 w-4"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1 mt-auto">
                                        <Badge variant="outline" className={`${getRoomTypeColor(room.type)} text-xs py-0.5 justify-center`}>
                                            {room.type}
                                        </Badge>
                                        <Badge variant="outline" className={`${getStatusColor(room.status)} text-xs py-0.5 justify-center`}>
                                            {room.status === 'Assigned to Clean' ? 'Assigned' : room.status}
                                        </Badge>
                                        <div className="text-xs text-gray-500 text-center mt-1">
                                            Floor {room.floor}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredRooms.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No rooms found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}