"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Users
} from "lucide-react";
import Link from "next/link";
import CustomerForm from "../components/CustomerForm";


export default function NewCustomerPage() {
    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/customers">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Customers
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Users className="w-8 h-8 text-blue-600 mr-3" />
                            Add New Customer
                          
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Create a new customer record with NIC validation and VIP status
                        </p>
                    </div>
                </div>
            </div>

          
           

            {/* Customer Form */}
            <CustomerForm />
        </div>
    );
}