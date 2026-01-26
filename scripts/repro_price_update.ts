
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fceutyeqmophbbpfcijy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZXV0eWVxbW9waGJicGZjaWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc0MTQsImV4cCI6MjA4NDc5MzQxNH0.PEbnB2d1q0nbV_qKD48vAk5B350Riyvhcm6ExVE8Mgk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log("Fetching a book...");
    const { data: books, error: fetchError } = await supabase.from('books').select('*').limit(1);

    if (fetchError || !books || books.length === 0) {
        console.error("Fetch failed:", fetchError);
        return;
    }

    const book = books[0];
    console.log(`Testing with Book: ${book.title} (ID: ${book.id})`);
    console.log(`Current Price: ${book.price}`);

    const newPrice = 25.50; // Use a distinct value
    console.log(`Attempting to update price to: ${newPrice}`);

    const { data: updateData, error: updateError } = await supabase
        .from('books')
        .update({ price: newPrice })
        .eq('id', book.id)
        .select();

    if (updateError) {
        console.error("Update FAILED:", updateError);
    } else {
        console.log("Update SUCCESS. Result:", updateData);
    }
}

run();
