<!-- 📁 app/hr/
├── 📄 page.tsx                    # HR Dashboard
├── 📁 departments/
│   ├── 📄 page.tsx               # Department list (2.1)
│   ├── 📄 new/page.tsx           # Create department
│   └── 📄 [id]/edit/page.tsx     # Edit department
├── 📁 staff-classes/
│   ├── 📄 page.tsx               # Staff classes list (2.2)
│   ├── 📄 new/page.tsx           # Create staff class with salary config
│   └── 📄 [id]/edit/page.tsx     # Edit staff class & rates
├── 📁 employees/
│   ├── 📄 page.tsx               # Employee list & management (2.3)
│   ├── 📄 new/page.tsx           # Create employee & login (2.3)
│   ├── 📄 [id]/
│   │   ├── 📄 page.tsx           # Employee details
│   │   ├── 📄 edit/page.tsx      # Edit employee
│   │   ├── 📄 privileges/page.tsx # Custom privileges (2.11)
│   │   └── 📄 documents/page.tsx  # Staff documents (2.9)
│   └── 📁 recruitment/
│       ├── 📄 page.tsx           # Recruitment management (2.9)
│       └── 📄 new/page.tsx       # Add new recruitment
├── 📁 attendance/
│   ├── 📄 page.tsx               # Daily attendance (2.4)
│   ├── 📄 mark/page.tsx          # Mark attendance
│   ├── 📄 leaves/page.tsx        # Leave management (2.4, 2.5)
│   └── 📄 reports/page.tsx       # Attendance reports
├── 📁 shifts/
│   ├── 📄 page.tsx               # Shift management (2.6)
│   ├── 📄 schedule/page.tsx      # Night shift scheduling
│   └── 📄 assignments/page.tsx   # Staff shift assignments
├── 📁 payroll/
│   ├── 📄 page.tsx               # Payroll dashboard (2.7)
│   ├── 📄 calculate/page.tsx     # Salary calculation (2.7)
│   ├── 📄 advance/page.tsx       # Advance settlements (2.8)
│   └── 📄 history/page.tsx       # Payroll history
├── 📁 appraisals/
│   ├── 📄 page.tsx               # Appraisal scheduling (2.10)
│   ├── 📄 schedule/page.tsx      # Schedule appraisals
│   └── 📄 [id]/page.tsx          # Appraisal details
└── 📁 components/
    ├── DepartmentCard.tsx        # Department display
    ├── StaffClassForm.tsx        # Staff class configuration
    ├── EmployeeForm.tsx          # Employee creation form
    ├── PrivilegeManager.tsx      # Custom privileges (2.11)
    ├── AttendanceTracker.tsx     # Daily attendance marking
    ├── LeaveManager.tsx          # Leave tracking & alerts (2.5)
    ├── ShiftScheduler.tsx        # Night shift planning
    ├── PayrollCalculator.tsx     # Auto salary calculation
    ├── AppraisalScheduler.tsx    # Appraisal notifications
    └── DocumentUploader.tsx      # Staff document storage -->




    📁 app/hr/
├── 📄 page.tsx                    # HR Dashboard - Overview of all HR functions
├── 📁 departments/
│   ├── 📄 page.tsx               # Department list (📍 2.1 - Create departments: front office, kitchen etc.)
│   ├── 📄 new/page.tsx           # Create department (📍 2.1)
│   └── 📄 [id]/edit/page.tsx     # Edit department (📍 2.1)
├── 📁 staff-classes/
│   ├── 📄 page.tsx               # Staff classes list (📍 2.2 - Create staff classes: Receptionist, minor staff etc.)
│   ├── 📄 new/page.tsx           # Create staff class with salary config (📍 2.2 - Hourly/daily/monthly salary + night shift payments)
│   └── 📄 [id]/edit/page.tsx     # Edit staff class & rates (📍 2.2 - Max leaves per month/annum, night shift rates)
├── 📁 employees/
│   ├── 📄 page.tsx               # Employee list & management (📍 2.3 - Create logins with username/password)
│   ├── 📄 new/page.tsx           # Create employee & login (📍 2.3 - Assign to relevant department)
│   ├── 📄 [id]/
│   │   ├── 📄 page.tsx           # Employee details
│   │   ├── 📄 edit/page.tsx      # Edit employee
│   │   ├── 📄 privileges/page.tsx # Custom privileges (📍 2.11 - Add custom access privileges)
│   │   └── 📄 documents/page.tsx  # Staff documents (📍 2.9 - Store documents, check when needed)
│   └── 📁 recruitment/
│       ├── 📄 page.tsx           # Recruitment management (📍 2.9 - Recruit new staff)
│       └── 📄 new/page.tsx       # Add new recruitment (📍 2.9 - Complete biography)
├── 📁 attendance/
│   ├── 📄 page.tsx               # Daily attendance (📍 2.4 - Mark attendance daily)
│   ├── 📄 mark/page.tsx          # Mark attendance (📍 2.4 - Mark absent as leave with type)
│   ├── 📄 leaves/page.tsx        # Leave management (📍 2.4, 📍 2.5 - Leave limit alerts)
│   └── 📄 reports/page.tsx       # Attendance reports
├── 📁 shifts/
│   ├── 📄 page.tsx               # Shift management (📍 2.6 - Add night shifts)
│   ├── 📄 schedule/page.tsx      # Night shift scheduling (📍 2.6 - Add staff for each shift)
│   └── 📄 assignments/page.tsx   # Staff shift assignments (📍 2.6)
├── 📁 payroll/
│   ├── 📄 page.tsx               # Payroll dashboard (📍 2.7 - View automatically calculated salaries)
│   ├── 📄 calculate/page.tsx     # Salary calculation (📍 2.7 - Automatic salary calculation)
│   ├── 📄 advance/page.tsx       # Advance settlements (📍 2.8 - Select date range for advance calculation)
│   └── 📄 history/page.tsx       # Payroll history
├── 📁 appraisals/
│   ├── 📄 page.tsx               # Appraisal scheduling (📍 2.10 - Schedule appraisals with date)
│   ├── 📄 schedule/page.tsx      # Schedule appraisals (📍 2.10 - Admin notifications when date is close)
│   └── 📄 [id]/page.tsx          # Appraisal details (📍 2.10)
└── 📁 components/
    ├── DepartmentCard.tsx        # Department display (📍 2.1)
    ├── StaffClassForm.tsx        # Staff class configuration (📍 2.2)
    ├── EmployeeForm.tsx          # Employee creation form (📍 2.3)
    ├── PrivilegeManager.tsx      # Custom privileges (📍 2.11 - Access controls listed below)
    ├── AttendanceTracker.tsx     # Daily attendance marking (📍 2.4)
    ├── LeaveManager.tsx          # Leave tracking & alerts (📍 2.5 - Holiday limit notifications)
    ├── ShiftScheduler.tsx        # Night shift planning (📍 2.6)
    ├── PayrollCalculator.tsx     # Auto salary calculation (📍 2.7, 📍 2.8)
    ├── AppraisalScheduler.tsx    # Appraisal notifications (📍 2.10)
    └── DocumentUploader.tsx      # Staff document storage (📍 2.9)