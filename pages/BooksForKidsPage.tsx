import React, { useState } from 'react';
import { Wish, Book } from '../types';
import { MOCK_WISHES, BOOKS } from '../lib/mockData';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DonationModal from '../components/DonationModal';

const WishRequestForm: React.FC<{ onAddWish: (wish: Wish) => void }> = ({ onAddWish }) => {
    const [age, setAge] = useState('');
    const [interests, setInterests] = useState('');
    const [theme, setTheme] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newWish: Wish = {
            id: `WISH-${Date.now()}`,
            age: parseInt(age, 10),
            interests,
            theme,
            status: 'Open',
        };
        onAddWish(newWish);
        setAge('');
        setInterests('');
        setTheme('');
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="bg-forest/10 p-8 rounded-lg text-center">
                <h3 className="text-2xl font-semibold text-forest mb-2">Thank You!</h3>
                <p className="text-deep-blue mb-4">Your wish has been submitted for review by our team.</p>
                <Button onClick={() => setSubmitted(false)}>Make Another Wish</Button>
            </div>
        );
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="age" className="block text-sm font-medium text-deep-blue mb-1">Child's Age</label>
                <Input type="number" id="age" value={age} onChange={e => setAge(e.target.value)} min="1" max="18" required />
            </div>
            <div>
                <label htmlFor="interests" className="block text-sm font-medium text-deep-blue mb-1">Interests</label>
                <Input type="text" id="interests" value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g., Dinosaurs, space, friendship" required />
            </div>
            <div>
                <label htmlFor="theme" className="block text-sm font-medium text-deep-blue mb-1">Desired Theme or Message</label>
                <textarea 
                    id="theme" 
                    value={theme} 
                    onChange={e => setTheme(e.target.value)}
                    className="w-full p-3 border border-accent rounded-md focus:ring-2 focus:ring-forest transition-colors min-h-[100px]"
                    placeholder="e.g., A story about overcoming shyness"
                    rows={3} 
                    required 
                />
            </div>
            <Button type="submit" className="w-full">Submit Wish</Button>
        </form>
    );
};

const WishCard: React.FC<{ wish: Wish; onFulfill: () => void }> = ({ wish, onFulfill }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col border-t-4 border-accent">
        <h3 className="font-serif text-xl font-bold text-deep-blue">A book for a {wish.age}-year-old</h3>
        <p className="text-gray-600 mt-2 flex-grow"><strong className="font-semibold">Interests:</strong> {wish.interests}</p>
        <p className="text-gray-600 mt-1 flex-grow"><strong className="font-semibold">Theme:</strong> {wish.theme}</p>
        <Button onClick={onFulfill} className="mt-4 w-full">Fulfill This Wish</Button>
    </div>
);


const BooksForKidsPage: React.FC = () => {
    const [wishes, setWishes] = useState<Wish[]>(MOCK_WISHES);
    const [activeTab, setActiveTab] = useState<'fulfill' | 'request'>('fulfill');
    const [selectedWish, setSelectedWish] = useState<Wish | null>(null);

    const addWish = (wish: Wish) => {
        setWishes(prev => [wish, ...prev]);
    };

    const handleFulfillWish = (updatedWish: Wish) => {
        setWishes(prev => prev.map(w => w.id === updatedWish.id ? updatedWish : w));
        setSelectedWish(null);
    };

    const openWishes = wishes.filter(w => w.status === 'Open');

    return (
        <div>
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-deep-blue mb-4">Books for Kids</h1>
                <p className="text-lg text-gray-700">
                    Connect with children in need of encouragement through the power of a book. You can request a book on behalf of a child, or become a donor and fulfill a wish.
                </p>
            </div>
            
            <div className="flex justify-center my-8">
                <div className="bg-gray-200 p-1 rounded-lg flex space-x-1">
                    <Button variant={activeTab === 'fulfill' ? 'primary' : 'ghost'} onClick={() => setActiveTab('fulfill')}>Fulfill a Wish ({openWishes.length})</Button>
                    <Button variant={activeTab === 'request' ? 'primary' : 'ghost'} onClick={() => setActiveTab('request')}>Request a Book</Button>
                </div>
            </div>

            {activeTab === 'fulfill' ? (
                 <div>
                    <h2 className="font-serif text-3xl font-bold text-deep-blue mb-6 text-center">Open Wishes</h2>
                    {openWishes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {openWishes.map(wish => (
                                <WishCard key={wish.id} wish={wish} onFulfill={() => setSelectedWish(wish)} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-600 bg-white p-8 rounded-lg shadow-sm">All wishes are currently fulfilled. Thank you for your generosity!</p>
                    )}
                 </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="font-serif text-3xl font-bold text-deep-blue mb-6 text-center">Request a Book for a Child</h2>
                    <WishRequestForm onAddWish={addWish} />
                </div>
            )}

            {selectedWish && (
                <DonationModal
                    wish={selectedWish}
                    allBooks={BOOKS}
                    onClose={() => setSelectedWish(null)}
                    onConfirm={handleFulfillWish}
                />
            )}
        </div>
    );
};

export default BooksForKidsPage;
