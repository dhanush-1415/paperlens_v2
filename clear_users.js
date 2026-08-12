import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function clearUsers() {
  console.log("Fetching existing users...");
  
  let hasMore = true;
  let page = 1;
  let totalDeleted = 0;

  while (hasMore) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 50
    });

    if (error) {
      console.error("Error fetching users:", error);
      break;
    }

    if (users.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Found ${users.length} users on page ${page}. Deleting...`);

    for (const user of users) {
      const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
      if (delError) {
        console.error(`Failed to delete user ${user.id}:`, delError);
      } else {
        totalDeleted++;
      }
    }
  }

  console.log(`\nSuccess! Completely wiped ${totalDeleted} users from the authentication system.`);
}

clearUsers();
