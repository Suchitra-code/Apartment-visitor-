const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Flat = require('../models/Flat');
const Visitor = require('../models/Visitor');
const Ticket = require('../models/Ticket');
const Staff = require('../models/Staff');
const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const BlacklistedVisitor = require('../models/BlacklistedVisitor');

const seedData = async () => {
  try {
    console.log('🌱 Starting comprehensive ApartmentHub seed operation...');

    // Clear existing collections
    await User.deleteMany({});
    await Flat.deleteMany({});
    await Visitor.deleteMany({});
    await Ticket.deleteMany({});
    await Staff.deleteMany({});
    await Notice.deleteMany({});
    await Notification.deleteMany({});
    await BlacklistedVisitor.deleteMany({});

    console.log('🧹 Purged existing collections.');

    // 1. Create Flats (Blocks A, B, C across multiple floors)
    const blocks = ['A', 'B', 'C'];
    const flatDocs = [];
    for (const block of blocks) {
      for (let floor = 1; floor <= 5; floor++) {
        for (let unit = 1; unit <= 4; unit++) {
          const number = `${floor}0${unit}`;
          const type = unit === 1 ? '1BHK' : unit === 4 ? '3BHK' : '2BHK';
          flatDocs.push({
            block,
            floor,
            number,
            type,
            status: 'vacant',
            residents: [],
          });
        }
      }
    }
    const createdFlats = await Flat.insertMany(flatDocs);
    console.log(`🏢 Created ${createdFlats.length} flats across Blocks A, B, and C.`);

    // 2. Create Core Demo Users
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const residentPassHash = await bcrypt.hash('Resident@123', 10);
    const guardPassHash = await bcrypt.hash('Guard@123', 10);

    // Admin
    const adminUser = await User.create({
      name: 'Eleanor Vance (Society President)',
      email: 'admin@apartmenthub.com',
      phone: '+1 987-654-3210',
      password: passwordHash,
      role: 'admin',
      status: 'approved',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    // Guard 1 (Demo Gate Guard)
    const guardUser = await User.create({
      name: 'Marcus Brody (Gate 1 Head)',
      email: 'guard@apartmenthub.com',
      phone: '+1 555-019-2831',
      password: guardPassHash,
      role: 'guard',
      status: 'approved',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    // Guard 2 & Guard 3
    await User.create([
      {
        name: 'Ramesh Patel (Gate 2 Night Shift)',
        email: 'guard2@apartmenthub.com',
        phone: '+1 555-019-2832',
        password: guardPassHash,
        role: 'guard',
        status: 'approved',
      },
      {
        name: 'Carlos Mendez (Tower C Concierge)',
        email: 'guard3@apartmenthub.com',
        phone: '+1 555-019-2833',
        password: guardPassHash,
        role: 'guard',
        status: 'approved',
      },
    ]);

    // Primary Demo Resident (Assigned to Flat A-101)
    const demoFlat = createdFlats.find((f) => f.block === 'A' && f.number === '101');
    const demoResident = await User.create({
      name: 'Alexander Wright',
      email: 'resident@apartmenthub.com',
      phone: '+1 555-789-0123',
      password: residentPassHash,
      role: 'resident',
      flat: demoFlat._id,
      residentType: 'owner',
      familyMembersCount: 3,
      vehicles: [
        { vehicleType: '4-wheeler', registrationNumber: 'KA-01-MJ-4092' },
        { vehicleType: '2-wheeler', registrationNumber: 'KA-01-EE-9021' },
      ],
      status: 'approved',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });
    demoFlat.residents.push(demoResident._id);
    demoFlat.status = 'occupied';
    await demoFlat.save();

    // 25+ Realistic Residents across flats
    const residentNames = [
      { name: 'Sophia Chen', email: 'sophia.c@example.com', type: 'owner' },
      { name: 'Liam Johnson', email: 'liam.j@example.com', type: 'tenant' },
      { name: 'Aarav Sharma', email: 'aarav.s@example.com', type: 'owner' },
      { name: 'Emma Wilson', email: 'emma.w@example.com', type: 'owner' },
      { name: 'Noah Martinez', email: 'noah.m@example.com', type: 'tenant' },
      { name: 'Olivia Taylor', email: 'olivia.t@example.com', type: 'owner' },
      { name: 'Lucas Anderson', email: 'lucas.a@example.com', type: 'tenant' },
      { name: 'Priya Iyer', email: 'priya.i@example.com', type: 'owner' },
      { name: 'Ethan Thomas', email: 'ethan.t@example.com', type: 'owner' },
      { name: 'Mia Jackson', email: 'mia.j@example.com', type: 'tenant' },
      { name: 'Benjamin White', email: 'benjamin.w@example.com', type: 'owner' },
      { name: 'Ananya Gupta', email: 'ananya.g@example.com', type: 'owner' },
      { name: 'Daniel Harris', email: 'daniel.h@example.com', type: 'tenant' },
      { name: 'Chloe Martin', email: 'chloe.m@example.com', type: 'owner' },
      { name: 'Henry Clark', email: 'henry.c@example.com', type: 'owner' },
      { name: 'Zoe Lewis', email: 'zoe.l@example.com', type: 'tenant' },
      { name: 'Rohan Verma', email: 'rohan.v@example.com', type: 'owner' },
      { name: 'Grace Walker', email: 'grace.w@example.com', type: 'owner' },
      { name: 'Jack Hall', email: 'jack.h@example.com', type: 'tenant' },
      { name: 'Emily Allen', email: 'emily.a@example.com', type: 'owner' },
      { name: 'David Young', email: 'david.y@example.com', type: 'tenant' },
      { name: 'Kavita Reddy', email: 'kavita.r@example.com', type: 'owner' },
      { name: 'Samuel King', email: 'samuel.k@example.com', type: 'owner' },
      { name: 'Hannah Scott', email: 'hannah.s@example.com', type: 'tenant' },
      { name: 'James Green', email: 'james.g@example.com', type: 'owner' },
    ];

    const allResidents = [demoResident];
    for (let i = 0; i < residentNames.length; i++) {
      const flat = createdFlats[i + 1];
      const resUser = await User.create({
        name: residentNames[i].name,
        email: residentNames[i].email,
        phone: `+1 555-888-01${i < 10 ? '0' + i : i}`,
        password: residentPassHash,
        role: 'resident',
        flat: flat._id,
        residentType: residentNames[i].type,
        status: i === 0 ? 'pending' : 'approved', // One pending for admin verification demo
        familyMembersCount: (i % 3) + 1,
      });
      flat.residents.push(resUser._id);
      flat.status = 'occupied';
      await flat.save();
      allResidents.push(resUser);
    }
    console.log(`👥 Seeded ${allResidents.length} Residents with assigned apartments.`);

    // 3. Create Staff / Technicians (8 Specializations)
    const staffList = [
      { name: 'Vikram Singh', phone: '+1 555-432-1001', specialization: 'Plumber', availability: 'Available' },
      { name: 'David Miller', phone: '+1 555-432-1002', specialization: 'Electrician', availability: 'Available' },
      { name: 'Sunita Rao', phone: '+1 555-432-1003', specialization: 'Housekeeping', availability: 'Available' },
      { name: 'Robert Fox', phone: '+1 555-432-1004', specialization: 'Lift Technician', availability: 'Busy' },
      { name: 'Kiran Kumar', phone: '+1 555-432-1005', specialization: 'Carpenter', availability: 'Available' },
      { name: 'Anand Joshi', phone: '+1 555-432-1006', specialization: 'Security Officer', availability: 'Available' },
      { name: 'Farooq Sheikh', phone: '+1 555-432-1007', specialization: 'Pest Specialist', availability: 'Available' },
      { name: 'John Doe', phone: '+1 555-432-1008', specialization: 'HVAC/General Maintenance', availability: 'Available' },
    ];
    const createdStaff = await Staff.insertMany(staffList);
    console.log(`🔧 Seeded ${createdStaff.length} society staff members and specialized technicians.`);

    // 4. Create Notices & Announcements (Pinned & Emergency)
    await Notice.create([
      {
        title: '🚨 Emergency Water Pipe Line Repair - Tower B',
        body: 'Due to an urgent leak in the main distribution pump, water supply to Tower B will be restricted between 2:00 PM and 5:00 PM today. Please plan accordingly. Bottled water is stationed in the clubhouse.',
        category: 'Emergency',
        isPinned: true,
        author: adminUser._id,
      },
      {
        title: 'Annual General Body Meeting (AGM) 2026',
        body: 'All homeowners are invited to attend the annual AGM on Sunday at 10:00 AM in the Community Hall. Agenda includes EV charger installation and solar rooftop project approval.',
        category: 'Event',
        isPinned: true,
        author: adminUser._id,
      },
      {
        title: 'Swimming Pool Closed for Scheduled Maintenance',
        body: 'The swimming pool will undergo deep chlorination and tile inspection this Tuesday and Wednesday. It will reopen Thursday morning.',
        category: 'Maintenance',
        isPinned: false,
        author: adminUser._id,
      },
      {
        title: 'New Visitor QR Gate Entry Rules Effective Next Week',
        body: 'To improve gate security, all delivery executives and cabs must provide a 6-digit passcode or QR code pass generated by residents on ApartmentHub.',
        category: 'General',
        isPinned: false,
        author: adminUser._id,
      },
      {
        title: 'Fire Drill & Safety Workshop by City Fire Dept',
        body: 'Join us this Saturday 4 PM for an interactive fire safety simulation and extinguisher training session in the central courtyard.',
        category: 'Event',
        isPinned: false,
        author: adminUser._id,
      },
      {
        title: 'Monsoon Preparedness & Balcony Drain Check',
        body: 'Residents are kindly requested to ensure balcony drains are clear of debris ahead of expected heavy rainfall this weekend.',
        category: 'General',
        isPinned: false,
        author: adminUser._id,
      },
    ]);
    console.log(`📢 Published community notices and emergency alerts.`);

    // 5. Seed ~150 Visitors over last 30 days
    const visitorNames = [
      'Michael Scott', 'Dwight Schrute', 'Jim Halpert', 'Pam Beesly', 'Stanley Hudson',
      'Phyllis Vance', 'Ryan Howard', 'Andy Bernard', 'Toby Flenderson', 'Angela Martin',
      'Oscar Martinez', 'Kevin Malone', 'Meredith Palmer', 'Creed Bratton', 'Kelly Kapoor',
      'Darryl Philbin', 'Gabe Lewis', 'Erin Hannon', 'Jan Levinson', 'Roy Anderson',
      'David Wallace', 'Karen Filippelli', 'Holly Flax', 'Bob Vance', 'Todd Packer'
    ];
    const purposes = ['guest', 'delivery', 'cab', 'service', 'other'];
    const statuses = ['Checked-Out', 'Checked-Out', 'Checked-In', 'Pre-approved', 'Pending Approval', 'Denied', 'Expired'];

    const visitorDocs = [];
    const now = Date.now();
    for (let i = 0; i < 150; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const pastTime = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000);
      const visitorName = visitorNames[i % visitorNames.length] + (i >= 25 ? ` ${Math.floor(i / 25) + 1}` : '');
      const purpose = purposes[i % purposes.length];
      const resident = allResidents[i % allResidents.length];
      const status = daysAgo > 1 ? (Math.random() > 0.1 ? 'Checked-Out' : 'Expired') : statuses[i % statuses.length];

      const passCode = `${Math.floor(100000 + Math.random() * 900000)}`;
      const inTime = status === 'Checked-In' || status === 'Checked-Out' ? new Date(pastTime.getTime() + 10 * 60 * 1000) : null;
      const duration = status === 'Checked-Out' ? Math.floor(20 + Math.random() * 180) : null;
      const outTime = duration ? new Date(inTime.getTime() + duration * 60 * 1000) : null;

      visitorDocs.push({
        name: visitorName,
        phone: `+1 555-300-${1000 + i}`,
        purpose,
        vehicleNumber: i % 2 === 0 ? `KA-04-AB-${1000 + i}` : '',
        flat: resident.flat,
        host: resident._id,
        passCode,
        expectedAt: pastTime,
        validUntil: new Date(pastTime.getTime() + 24 * 60 * 60 * 1000),
        peopleCount: (i % 3) + 1,
        status,
        checkInAt: inTime,
        checkOutAt: outTime,
        durationMinutes: duration,
        isWalkIn: i % 3 === 0,
        createdBy: i % 3 === 0 ? guardUser._id : resident._id,
      });
    }
    await Visitor.insertMany(visitorDocs);
    console.log(`🚗 Seeded 150 visitors spanning the past 30 days.`);

    // 6. Seed ~40 Maintenance Tickets in varied states with timelines and comments
    const ticketCategories = ['Plumbing', 'Electrical', 'Lift', 'Cleaning', 'Security', 'Carpentry', 'Pest Control', 'Other'];
    const ticketPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    const ticketStatuses = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

    const sampleTicketData = [
      { title: 'Kitchen sink dripping persistently', cat: 'Plumbing', prio: 'Medium', desc: 'The mixer faucet in the kitchen is continuously dripping when closed tightly.' },
      { title: 'Main circuit breaker tripping when geyser is switched on', cat: 'Electrical', prio: 'Urgent', desc: 'Whenever the bathroom water heater is activated, the entire apartment MCB trips.' },
      { title: 'Intermittent screeching sound in Tower A elevator', cat: 'Lift', prio: 'High', desc: 'Elevator 2 in Tower A makes a loud metallic grinding sound between 3rd and 4th floors.' },
      { title: 'Corridor deep cleaning requested on 4th floor', cat: 'Cleaning', prio: 'Low', desc: 'Spill marks near flat 403 need pressure washing.' },
      { title: 'Balcony sliding door latch broken', cat: 'Carpentry', prio: 'Medium', desc: 'Lock mechanism fell out and balcony door cannot be securely latched.' },
      { title: 'Pest treatment needed for kitchen cabinets', cat: 'Pest Control', prio: 'Medium', desc: 'Noticed small roaches in lower modular cabinets.' },
      { title: 'Main door intercom audio crackling', cat: 'Security', prio: 'Low', desc: 'Cannot hear security guard voice clearly on the wall phone.' },
      { title: 'Basement parking slot water seepage', cat: 'Plumbing', prio: 'High', desc: 'Overhead drain pipe above parking slot A-12 is leaking dirty water on vehicles.' },
    ];

    const ticketDocs = [];
    for (let i = 0; i < 40; i++) {
      const sample = sampleTicketData[i % sampleTicketData.length];
      const resident = allResidents[i % allResidents.length];
      const status = ticketStatuses[i % ticketStatuses.length];
      const staff = createdStaff[i % createdStaff.length];
      const tNum = `TIK-${70000 + i}`;

      const tCreated = new Date(Date.now() - (35 - i) * 18 * 60 * 60 * 1000);
      const isResolvedOrClosed = status === 'Resolved' || status === 'Closed';

      ticketDocs.push({
        ticketNumber: tNum,
        title: `${sample.title} (#${i + 1})`,
        category: sample.cat,
        priority: ticketPriorities[i % ticketPriorities.length],
        description: sample.desc,
        images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'],
        flat: resident.flat,
        createdBy: resident._id,
        assignedTo: status !== 'Open' ? staff._id : undefined,
        preferredSlot: '10:00 AM - 1:00 PM',
        status,
        dueDate: new Date(tCreated.getTime() + 48 * 60 * 60 * 1000),
        resolvedAt: isResolvedOrClosed ? new Date(tCreated.getTime() + 24 * 60 * 60 * 1000) : null,
        rating: isResolvedOrClosed ? 4 + (i % 2) : undefined,
        feedback: isResolvedOrClosed ? 'Great prompt service by technician!' : '',
        timeline: [
          { status: 'Open', actor: resident._id, notes: 'Ticket raised', timestamp: tCreated },
          ...(status !== 'Open'
            ? [{ status: 'Assigned', actor: adminUser._id, notes: `Assigned to ${staff.name}`, timestamp: new Date(tCreated.getTime() + 2 * 60 * 60 * 1000) }]
            : []),
          ...(status === 'In Progress' || isResolvedOrClosed
            ? [{ status: 'In Progress', actor: adminUser._id, notes: 'Technician on-site inspecting', timestamp: new Date(tCreated.getTime() + 6 * 60 * 60 * 1000) }]
            : []),
          ...(isResolvedOrClosed
            ? [{ status: 'Resolved', actor: adminUser._id, notes: 'Repair completed and tested', timestamp: new Date(tCreated.getTime() + 24 * 60 * 60 * 1000) }]
            : []),
        ],
        comments: [
          {
            sender: resident._id,
            message: 'Hello, please inspect during morning hours if possible as I work from home.',
            createdAt: new Date(tCreated.getTime() + 1 * 60 * 60 * 1000),
          },
          {
            sender: adminUser._id,
            message: `Noted. Assigned technician ${staff.name} will arrive at 11:00 AM.`,
            createdAt: new Date(tCreated.getTime() + 3 * 60 * 60 * 1000),
          },
        ],
      });
    }
    await Ticket.insertMany(ticketDocs);
    console.log(`🎫 Seeded 40 maintenance tickets with SLA, timelines, and live comment threads.`);

    // 7. Seed Blacklisted Visitors
    await BlacklistedVisitor.create([
      {
        name: 'Devin Larson',
        phone: '+1 555-999-0001',
        reason: 'Repeated unauthorized access attempts and altercation with security.',
        addedBy: adminUser._id,
      },
      {
        name: 'Unknown Courier Agent',
        phone: '+1 555-999-0002',
        reason: 'Reported package tampering and trespassing on restricted floors.',
        addedBy: adminUser._id,
      },
    ]);
    console.log(`🚫 Seeded blacklisted visitor security entries.`);

    console.log('✨ All seed data successfully generated and loaded into MongoDB!');
    return true;
  } catch (error) {
    console.error('❌ Error during data seed operation:', error);
    throw error;
  }
};

module.exports = seedData;
