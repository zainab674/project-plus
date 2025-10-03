import { useState, useEffect } from "react";
import { Phone, Search, MapPin, DollarSign, Filter, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import { api } from "@/lib/http";

export default function AvailablePhoneNumbers() {
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useState({
        country: 'US',
        areaCode: '',
        contains: '',
        type: 'local',
        limit: 20
    });

    const fetchAvailableNumbers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            console.log('🔍 API base URL:', api.defaults.baseURL);
            console.log('🔍 Search params:', searchParams);
            
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Available Phone Numbers</h2>
                    <p className="text-gray-600">Browse and search for phone numbers from Twilio</p>
                </div>
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
            ) : phoneNumbers.length === 0 ? (
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
                        <h3 className="text-lg font-semibold">Found {phoneNumbers.length} Numbers</h3>
                        <Badge variant="outline">
                            {searchParams.type.charAt(0).toUpperCase() + searchParams.type.slice(1)} Numbers
                        </Badge>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {phoneNumbers.map((number, index) => (
                            <Card key={index} className="relative">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-lg">
                                        <Phone className="h-5 w-5 mr-2 text-blue-600" />
                                        {formatPhoneNumber(number.phoneNumber)}
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
                                            <span>${number.monthlyRate}/month</span>
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