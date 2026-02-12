import { useState, useEffect } from "react";
import { Phone, Search, MapPin, DollarSign, Filter, RefreshCw, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { api } from "@/lib/http";

export default function AvailablePhoneNumbers({
    currentNumber,
    onNumberAssigned = () => {}
}) {
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [customNumbers, setCustomNumbers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingNumber, setIsSavingNumber] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useState({
        country: 'US',
        areaCode: '',
        contains: '',
        type: 'local',
        limit: 20
    });

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newNumber, setNewNumber] = useState('');
    const [newLabel, setNewLabel] = useState('');

    const fetchAvailableNumbers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
        
            
            const response = await api.get('/twilio/numbers/search', {
                params: searchParams
            });

            setPhoneNumbers(response.data.results || []);
            
            if (response.data.results.length === 0) {
                toast.info('No numbers found with current search criteria');
            }
        } catch (error) {
            console.error('Error fetching available numbers:', error);
            setError(error.response?.data?.message || error.message);
            toast.error('Failed to load available numbers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailableNumbers();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem('customPhoneNumbers');
        if (stored) {
            try {
                setCustomNumbers(JSON.parse(stored));
            } catch (err) {
                console.warn('Failed to parse custom numbers from storage', err);
            }
        }
    }, []);

    const persistCustomNumbers = (numbers) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('customPhoneNumbers', JSON.stringify(numbers));
    };

    const formatPhoneNumber = (e164) => {
        if (!e164) return '';
        const cleaned = e164.replace('+', '');
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        }
        return e164;
    };

    const handleSearch = () => {
        fetchAvailableNumbers();
    };

    const handleParamChange = (key, value) => {
        setSearchParams(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleAddCustomNumber = async () => {
        const trimmed = newNumber.replace(/\s|-/g, '');
        const normalized = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
        if (!/^\+\d{7,15}$/.test(normalized)) {
            toast.error('Enter a valid phone number in E.164 format (e.g. +19862108561)');
            return;
        }

        const alreadyExists = [...customNumbers, ...phoneNumbers].some(
            (num) => num.phoneNumber === normalized
        );

        if (alreadyExists) {
            toast.error('This number is already in your list.');
            return;
        }

        setIsSavingNumber(true);

        try {
            await api.put('/user/update', { phone: normalized });
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to save number to your profile';
            toast.error(message);
            setIsSavingNumber(false);
            return;
        }

        const newEntry = {
            phoneNumber: normalized,
            friendlyName: newLabel || 'Custom Number',
            locality: 'Custom',
            region: '',
            isoCountry: 'Custom',
            capabilities: { voice: true, sms: false, mms: false },
            monthlyRate: 'N/A',
            isCustom: true
        };

        setCustomNumbers((prev) => {
            const updated = [...prev, newEntry];
            persistCustomNumbers(updated);
            return updated;
        });

        setIsAddDialogOpen(false);
        setNewNumber('');
        setNewLabel('');
        setIsSavingNumber(false);
        toast.success('Phone number saved to your profile');
        onNumberAssigned(normalized);
    };

    const combinedNumbers = [...customNumbers, ...phoneNumbers];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Available Phone Numbers</h2>
                    <p className="text-gray-600">Browse and search for phone numbers from Twilio</p>
                    {currentNumber && (
                        <p className="text-sm text-gray-600 mt-1">
                            Current outbound number:&nbsp;
                            <span className="font-semibold text-gray-900">
                                {formatPhoneNumber(currentNumber)}
                            </span>
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Number
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-full h-auto">
                            <DialogHeader>
                                <DialogTitle>Add Custom Phone Number</DialogTitle>
                                <DialogDescription>
                                    Store any existing Twilio-verified phone number so it is linked to your account.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Phone Number (E.164)
                                    </label>
                                    <Input
                                        value={newNumber}
                                        onChange={(e) => setNewNumber(e.target.value)}
                                        placeholder="+19862108561"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Label (optional)
                                    </label>
                                    <Input
                                        value={newLabel}
                                        onChange={(e) => setNewLabel(e.target.value)}
                                        placeholder="e.g., Main Office"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddCustomNumber} disabled={isSavingNumber}>
                                    {isSavingNumber ? 'Saving...' : 'Save Number'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button 
                        onClick={fetchAvailableNumbers} 
                        variant="outline" 
                        size="sm"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Search Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Filter className="h-5 w-5 mr-2" />
                        Search Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Country</label>
                            <Select value={searchParams.country} onValueChange={(value) => handleParamChange('country', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="US">United States</SelectItem>
                                    <SelectItem value="CA">Canada</SelectItem>
                                    <SelectItem value="GB">United Kingdom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700">Area Code</label>
                            <Input
                                placeholder="e.g., 555"
                                value={searchParams.areaCode}
                                onChange={(e) => handleParamChange('areaCode', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700">Contains</label>
                            <Input
                                placeholder="e.g., 123"
                                value={searchParams.contains}
                                onChange={(e) => handleParamChange('contains', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700">Type</label>
                            <Select value={searchParams.type} onValueChange={(value) => handleParamChange('type', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="local">Local</SelectItem>
                                    <SelectItem value="mobile">Mobile</SelectItem>
                                    <SelectItem value="tollFree">Toll Free</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <Button onClick={handleSearch} disabled={isLoading} className="w-full">
                        <Search className="h-4 w-4 mr-2" />
                        {isLoading ? 'Searching...' : 'Search Numbers'}
                    </Button>
                </CardContent>
            </Card>

            {/* Results */}
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Searching for available numbers...</span>
                </div>
            ) : error ? (
                <div className="text-center p-8">
                    <div className="text-red-600 mb-4">
                        <Phone className="h-12 w-12 mx-auto mb-2" />
                        <h3 className="text-lg font-semibold">Error Loading Numbers</h3>
                        <p className="text-sm text-gray-600">{error}</p>
                    </div>
                    <Button onClick={fetchAvailableNumbers} variant="outline">
                        Try Again
                    </Button>
                </div>
            ) : combinedNumbers.length === 0 ? (
                <Card>
                    <CardContent className="text-center p-8">
                        <Phone className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Numbers Found</h3>
                        <p className="text-gray-600 mb-4">
                            Try adjusting your search criteria to find available numbers.
                        </p>
                        <Button onClick={handleSearch} variant="outline">
                            Search Again
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                            Showing {combinedNumbers.length} Number{combinedNumbers.length === 1 ? '' : 's'}
                        </h3>
                        <Badge variant="outline">
                            {searchParams.type.charAt(0).toUpperCase() + searchParams.type.slice(1)} Numbers
                        </Badge>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {combinedNumbers.map((number, index) => (
                            <Card key={index} className="relative">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-lg gap-2">
                                        <Phone className="h-5 w-5 mr-2 text-blue-600" />
                                        {formatPhoneNumber(number.phoneNumber)}
                                        {number.isCustom && (
                                            <Badge variant="secondary" className="text-xs">
                                                Custom
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                
                                <CardContent className="space-y-3">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <span>
                                            {number.locality && number.region 
                                                ? `${number.locality}, ${number.region}` 
                                                : number.isoCountry
                                            }
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <DollarSign className="h-4 w-4 mr-1" />
                                            <span>
                                                {number.monthlyRate && number.monthlyRate !== 'N/A'
                                                    ? `$${number.monthlyRate}/month`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex gap-1">
                                            {number.capabilities.voice && (
                                                <Badge variant="outline" className="text-xs">Voice</Badge>
                                            )}
                                            {number.capabilities.sms && (
                                                <Badge variant="outline" className="text-xs">SMS</Badge>
                                            )}
                                            {number.capabilities.mms && (
                                                <Badge variant="outline" className="text-xs">MMS</Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-500">
                                        {number.friendlyName || 'No friendly name'}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}