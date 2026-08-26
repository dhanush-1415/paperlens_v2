import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Sanitize filename and create unique path
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage Bucket ('vault-documents')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vault-documents')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Supabase Storage Error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload to storage. Check bucket permissions.' },
        { status: 500 },
      );
    }

    // Create record in Prisma `documents` table
    const document = await prisma.document.create({
      data: {
        userId: session.userId,
        filename: file.name,
        fileType: file.type,
        byteSize: file.size,
        storagePath: uploadData.path,
        status: 'scanned', // Temporary, would be 'processing' if we had a background worker
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
