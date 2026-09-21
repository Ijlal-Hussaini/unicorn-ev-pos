import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';

const seedShowroomData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Seed Staff Users
    const staffUsers = [
      {
        username: 'Showroom Cashier',
        email: 'sales@unicornevbikes.com',
        password: 'sales123',
        role: 'sales',
        phone: '03001234567',
        cnic: '42101-1111111-1',
      },
      {
        username: 'Showroom Manager',
        email: 'manager@unicornevbikes.com',
        password: 'manager123',
        role: 'manager',
        phone: '03007654321',
        cnic: '42201-2222222-2',
      },
    ];

    for (const userData of staffUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        console.log(`Created staff user: ${userData.email} (${userData.role})`);
      }
    }

    // 2. Seed EV Bike Products with Serialized Units
    const productsData = [
      {
        sku: 'UN-LTG-72V',
        name: 'Unicorn Lightning 72V',
        model: 'Lightning 72V Edition',
        category: 'EV Bikes',
        price: 265000,
        cost: 210000,
        minStock: 2,
        supplier: 'Unicorn Electric Dynamics',
        description: 'Flagship high-speed electric motorcycle with 100km range and 72V Lithium phosphate power pack.',
        specifications: {
          maxSpeed: '75 km/h',
          range: '100 km',
          motor: '1500W Brushless DC',
          controller: '72V Intelligent Vector Controller',
          batteries: '72V 35Ah Graphene / Lithium',
          motorBatteryWarranty: '24 Months Official Warranty',
          brake: 'Front & Rear Hydraulic Disc',
          tyre: 'Tubeless 90/90-12',
          chargingTime: '4 - 5 Hours',
          batteryType: 'Lithium Iron Phosphate',
        },
        units: [
          {
            chassisNumber: 'UN-EV2026-001',
            motorNumber: 'MTR-72V-9001',
            batterySerial: 'BAT-LFP-7235-01',
            color: 'Matte Black',
            status: 'available',
          },
          {
            chassisNumber: 'UN-EV2026-002',
            motorNumber: 'MTR-72V-9002',
            batterySerial: 'BAT-LFP-7235-02',
            color: 'Gloss Crimson',
            status: 'available',
          },
          {
            chassisNumber: 'UN-EV2026-003',
            motorNumber: 'MTR-72V-9003',
            batterySerial: 'BAT-LFP-7235-03',
            color: 'Cyber Metallic Silver',
            status: 'available',
          },
        ],
      },
      {
        sku: 'UN-FLC-60V',
        name: 'Unicorn Falcon 60V',
        model: 'Falcon Urban',
        category: 'EV Bikes',
        price: 220000,
        cost: 175000,
        minStock: 2,
        supplier: 'Unicorn Electric Dynamics',
        description: 'Urban electric commuter scooter optimized for Pakistani city streets with durable suspension.',
        specifications: {
          maxSpeed: '60 km/h',
          range: '80 km',
          motor: '1200W High Efficiency',
          controller: '60V Sine Wave Controller',
          batteries: '60V 32Ah Lead-Acid / Graphene',
          motorBatteryWarranty: '18 Months Official Warranty',
          brake: 'Front Disc, Rear Drum',
          tyre: '3.00-10 Tubeless',
          chargingTime: '5 - 6 Hours',
          batteryType: 'Graphene Super Battery',
        },
        units: [
          {
            chassisNumber: 'UN-EV2026-101',
            motorNumber: 'MTR-60V-8001',
            batterySerial: 'BAT-GRP-6032-01',
            color: 'Ocean Blue',
            status: 'available',
          },
          {
            chassisNumber: 'UN-EV2026-102',
            motorNumber: 'MTR-60V-8002',
            batterySerial: 'BAT-GRP-6032-02',
            color: 'Pearl White',
            status: 'available',
          },
        ],
      },
      {
        sku: 'UN-THN-PRO',
        name: 'Unicorn Thunder Pro Max',
        model: 'Thunder Pro Max 2026',
        category: 'EV Bikes',
        price: 310000,
        cost: 250000,
        minStock: 1,
        supplier: 'Unicorn Electric Dynamics',
        description: 'Heavy duty long-range dual-suspension electric cruiser with fast charging.',
        specifications: {
          maxSpeed: '85 km/h',
          range: '130 km',
          motor: '2000W High-Torque BLDC',
          controller: '72V Dual Mode Controller',
          batteries: '72V 45Ah Lithium Iron',
          motorBatteryWarranty: '36 Months Official Warranty',
          brake: 'CBS Dual Disc Brakes',
          tyre: 'All-Terrain 110/70-12',
          chargingTime: '3.5 Hours Fast Charge',
          batteryType: 'Automotive Grade LFP',
        },
        units: [
          {
            chassisNumber: 'UN-EV2026-201',
            motorNumber: 'MTR-THN-2001',
            batterySerial: 'BAT-THN-7245-01',
            color: 'Army Matte Green',
            status: 'available',
          },
          {
            chassisNumber: 'UN-EV2026-202',
            motorNumber: 'MTR-THN-2002',
            batterySerial: 'BAT-THN-7245-02',
            color: 'Stealth Black',
            status: 'available',
          },
        ],
      },
      {
        sku: 'ACC-CHG-72V',
        name: 'Smart Fast Charger 72V',
        model: 'FC-72V-10A',
        category: 'Accessories',
        price: 12500,
        cost: 8000,
        stock: 15,
        minStock: 3,
        supplier: 'PowerTech Global',
        description: 'Over-voltage and short-circuit protected fast charger with LED status display.',
      },
      {
        sku: 'ACC-HLM-01',
        name: 'Unicorn Smart Safety Helmet',
        model: 'SH-PRO-DOT',
        category: 'Accessories',
        price: 6500,
        cost: 4000,
        stock: 8,
        minStock: 2,
        supplier: 'SafeRide Gear',
        description: 'DOT certified aerodynamic helmet with anti-fog visor and UV protection.',
      },
    ];

    for (const prodData of productsData) {
      const existing = await Product.findOne({ sku: prodData.sku });
      if (!existing) {
        const prod = new Product(prodData);
        prod.updateStatus();
        await prod.save();
        console.log(`Created product: ${prodData.name} (SKU: ${prodData.sku}, Stock: ${prod.stock})`);
      }
    }

    console.log('\n Showroom sample data seeded successfully!');
    console.log('Login credentials:');
    console.log('- Admin:   admin@unicornevbikes.com   / admin123');
    console.log('- Manager: manager@unicornevbikes.com / manager123');
    console.log('- Cashier: sales@unicornevbikes.com   / sales123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding showroom data:', error);
    process.exit(1);
  }
};

seedShowroomData();
