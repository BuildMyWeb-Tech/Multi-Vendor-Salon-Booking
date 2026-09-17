// backend/utils/migrateToMultiTenant.js
// Run once: node utils/migrateToMultiTenant.js
// Creates SHOP001 and migrates all existing data to it.
import mongoose from 'mongoose';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import shopModel from '../models/shopModel.js';
import salonAdminModel from '../models/salonAdminModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import ServiceCategory from '../models/ServiceCategory.js';
import SlotSettings from '../models/SlotSettings.js';
import BlockedDate from '../models/BlockedDate.js';
import RecurringHoliday from '../models/RecurringHoliday.js';
import SpecialWorkingDay from '../models/SpecialWorkingDay.js';
import AdminNotification from '../models/AdminNotification.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'salon-booking';

async function migrate() {
  try {
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
    console.log('✅ Connected to MongoDB');

    // 1. Create SHOP001 if it doesn't exist
    let shop = await shopModel.findOne({ shopId: 'SHOP001' });
    if (!shop) {
      shop = await shopModel.create({
        shopId: 'SHOP001',
        shopName: 'Style Studio',
        slug: 'style-studio',
        address: '',
        city: '',
        state: '',
        status: 'active',
      });
      console.log('✅ Created SHOP001 (Style Studio)');
    } else {
      console.log('ℹ️  SHOP001 already exists, skipping creation');
    }

    // 2. Create default salon admin for SHOP001 from env vars
    const existingAdmin = await salonAdminModel.findOne({ shopId: 'SHOP001' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await salonAdminModel.create({
        adminId: 'admin',
        name: 'Salon Admin',
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: hashedPassword,
        shopId: 'SHOP001',
        role: 'salon_admin',
      });
      console.log('✅ Created salon admin for SHOP001');
      console.log('   Admin ID: admin');
      console.log('   Password: (from ADMIN_PASSWORD env)');
    } else {
      console.log('ℹ️  Salon admin for SHOP001 already exists');
    }

    // 3. Migrate doctors
    const docResult = await doctorModel.updateMany({ shopId: { $exists: false } }, { $set: { shopId: 'SHOP001' } });
    const docResult2 = await doctorModel.updateMany({ shopId: null }, { $set: { shopId: 'SHOP001' } });
    console.log(`✅ Migrated ${docResult.modifiedCount + docResult2.modifiedCount} doctors to SHOP001`);

    // 4. Migrate appointments
    const apptResult = await appointmentModel.updateMany({ shopId: { $exists: false } }, { $set: { shopId: 'SHOP001' } });
    const apptResult2 = await appointmentModel.updateMany({ shopId: null }, { $set: { shopId: 'SHOP001' } });
    console.log(`✅ Migrated ${apptResult.modifiedCount + apptResult2.modifiedCount} appointments to SHOP001`);

    // 5. Migrate users
    const userResult = await userModel.updateMany({ shopId: { $exists: false } }, { $set: { shopId: 'SHOP001' } });
    const userResult2 = await userModel.updateMany({ shopId: null }, { $set: { shopId: 'SHOP001' } });
    console.log(`✅ Migrated ${userResult.modifiedCount + userResult2.modifiedCount} users to SHOP001`);

    // 6. Migrate services
    const svcResult = await ServiceCategory.updateMany({ shopId: { $exists: false } }, { $set: { shopId: 'SHOP001' } });
    const svcResult2 = await ServiceCategory.updateMany({ shopId: null }, { $set: { shopId: 'SHOP001' } });
    console.log(`✅ Migrated ${svcResult.modifiedCount + svcResult2.modifiedCount} services to SHOP001`);

    // 7. Migrate slot settings
    const slotResult = await SlotSettings.updateMany({ shopId: { $exists: false } }, { $set: { shopId: 'SHOP001' } });
    const slotResult2 = await SlotSettings.updateMany({ shopId: null }, { $set: { shopId: 'SHOP001' } });
    console.log(`✅ Migrated ${slotResult.modifiedCount + slotResult2.modifiedCount} slot settings to SHOP001`);

    // 8. Migrate blocked dates
    await BlockedDate.updateMany({ shopId: { $exists: false } }, { $set: { shopId: 'SHOP001' } });
    await BlockedDate.updateMany({ shopId: null }, { $set: { shopId: 'SHOP001' } });

    // 9. Migrate recurring holidays
    await RecurringHoliday.updateMany({ shopId: { $exists: false } }, { $set: { shopId: 'SHOP001' } });
    await RecurringHoliday.updateMany({ shopId: null }, { $set: { shopId: 'SHOP001' } });

    // 10. Migrate special working days
    await SpecialWorkingDay.updateMany({ shopId: { $exists: false } }, { $set: { shopId: 'SHOP001' } });
    await SpecialWorkingDay.updateMany({ shopId: null }, { $set: { shopId: 'SHOP001' } });

    // 11. Migrate admin notifications
    await AdminNotification.updateMany({ shopId: { $exists: false } }, { $set: { shopId: 'SHOP001' } });
    await AdminNotification.updateMany({ shopId: null }, { $set: { shopId: 'SHOP001' } });

    console.log('\n✅ Migration complete!');
    console.log('');
    console.log('🏪 SHOP001 (Style Studio)');
    console.log('   Customer URL : /style-studio');
    console.log('   Admin URL    : /style-studio/admin');
    console.log('   Admin ID     : admin');
    console.log('');
    console.log('🔑 Super Admin');
    console.log('   URL          : /super-admin/login');
    console.log(`   Email        : ${process.env.SUPER_ADMIN_EMAIL}`);
    console.log(`   Password     : ${process.env.SUPER_ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
