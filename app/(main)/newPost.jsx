import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { hp, wp } from "@/helpers/common";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

const NewPost = () => {
    const { user } = useAuth();
    const router = useRouter();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedFacilityImage, setSelectedFacilityImage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: ''
    });
    const [courts, setCourts] = useState([]);

    useEffect(() => {
        if (courts.length === 0) {
            addCourt();
        }
    }, []);

    const onSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert("Error", "Facility name is required");
            return;
        }

        if (!formData.location.trim()) {
            Alert.alert("Error", "Location is required");
            return;
        }

        const validCourts = courts.filter(court => court.courtName.trim());
        if (validCourts.length === 0) {
            Alert.alert("Error", "At least one court is required");
            return;
        }

        console.log('=== Starting Facility Creation ===');
        console.log('Form Data:', formData);
        console.log('Valid Courts:', validCourts);
        console.log('User ID:', user.id);

        setLoading(true);
        
        try {
            let facilityImageUrl = null;

            if (selectedFacilityImage) {
                try {
                    facilityImageUrl = await uploadImageToCloudinary(selectedFacilityImage.uri);
                } catch (error) {
                    Alert.alert("Error", "Failed to upload facility image. Please try again.");
                    setLoading(false);
                    return;
                }
            }

            const facilityInsertData = {
                name: formData.name.trim(),
                location: formData.location.trim(),
                image: facilityImageUrl,
                ownerId: user.id
            };
            
            console.log('Facility Insert Data:', facilityInsertData);
            
            const { data: facilityData, error: facilityError } = await supabase
                .from('facilities')
                .insert(facilityInsertData)
                .select()
                .single();

            if (facilityError) {
                console.error('Facility insert error:', facilityError);
                console.error('Error details:', JSON.stringify(facilityError, null, 2));
                Alert.alert("Error", "Failed to create facility");
                return;
            }

            console.log('Facility created successfully:', facilityData);

                                        for (const court of validCourts) {
                    let courtImageUrl = null;

                    if (court.courtImage) {
                        try {
                            courtImageUrl = await uploadImageToCloudinary(court.courtImage.uri);
                        } catch (error) {
                            console.error('Error uploading court image:', error);
                        }
                    }

                    const courtInsertData = {
                        courtName: court.courtName.trim(),
                        courtType: court.courtType,
                        facilityId: facilityData.id,
                        image: courtImageUrl
                    };
                
                console.log('Court Insert Data:', courtInsertData);
                
                const { data: courtData, error: courtError } = await supabase
                    .from('courts')
                    .insert(courtInsertData)
                    .select()
                    .single();

                if (courtError) {
                    console.error('Court insert error:', courtError);
                    console.error('Court error details:', JSON.stringify(courtError, null, 2));
                    continue;
                }

                console.log('Court created successfully:', courtData);

                for (const slot of court.slots) {
                    if (slot.selected) {
                        const slotInsertData = {
                            courtId: courtData.id,
                            dayOfWeek: slot.day,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            isBooked: false
                        };
                        
                        console.log('Slot Insert Data:', slotInsertData);
                        
                        const { error: slotError } = await supabase
                            .from('courtSlots')
                            .insert(slotInsertData);
                            
                        if (slotError) {
                            console.error('Slot insert error:', slotError);
                            console.error('Slot error details:', JSON.stringify(slotError, null, 2));
                        } else {
                            console.log('Slot created successfully');
                        }
                    }
                }
            }

            Alert.alert("Success", "Facility with courts and slots created successfully", [
                { text: "OK", onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('Error creating facility:', error);
            Alert.alert("Error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    };



    const addCourt = () => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const timePeriods = [
            { 
                name: 'Morning', 
                startTime: '06:00', 
                endTime: '12:00',
                slots: [
                    { startTime: '06:00', endTime: '07:00' },
                    { startTime: '07:00', endTime: '08:00' },
                    { startTime: '08:00', endTime: '09:00' },
                    { startTime: '09:00', endTime: '10:00' },
                    { startTime: '10:00', endTime: '11:00' },
                    { startTime: '11:00', endTime: '12:00' }
                ]
            },
            { 
                name: 'Afternoon', 
                startTime: '12:00', 
                endTime: '18:00',
                slots: [
                    { startTime: '12:00', endTime: '13:00' },
                    { startTime: '13:00', endTime: '14:00' },
                    { startTime: '14:00', endTime: '15:00' },
                    { startTime: '15:00', endTime: '16:00' },
                    { startTime: '16:00', endTime: '17:00' },
                    { startTime: '17:00', endTime: '18:00' }
                ]
            },
            { 
                name: 'Evening', 
                startTime: '18:00', 
                endTime: '22:00',
                slots: [
                    { startTime: '18:00', endTime: '19:00' },
                    { startTime: '19:00', endTime: '20:00' },
                    { startTime: '20:00', endTime: '21:00' },
                    { startTime: '21:00', endTime: '22:00' }
                ]
            },
            { 
                name: 'Night', 
                startTime: '22:00', 
                endTime: '06:00',
                slots: [
                    { startTime: '22:00', endTime: '23:00' },
                    { startTime: '23:00', endTime: '00:00' },
                    { startTime: '00:00', endTime: '01:00' },
                    { startTime: '01:00', endTime: '02:00' },
                    { startTime: '02:00', endTime: '03:00' },
                    { startTime: '03:00', endTime: '04:00' },
                    { startTime: '04:00', endTime: '05:00' },
                    { startTime: '05:00', endTime: '06:00' }
                ]
            }
        ];

        const allSlots = [];
        days.forEach(day => {
            timePeriods.forEach(period => {
                period.slots.forEach(timeSlot => {
                    allSlots.push({
                        ...timeSlot,
                        day: day,
                        period: period.name,
                        selected: false
                    });
                });
            });
        });

        setCourts(prev => [...prev, {
            courtName: '',
            courtType: 'Indoor',
            courtImage: null,
            slots: allSlots,
                            expandedDays: ['Monday'],
                expandedPeriods: ['Monday-Morning']
        }]);
    };

    const toggleSlot = (courtIndex, slotIndex) => {
        setCourts(prev => prev.map((court, i) => 
            i === courtIndex ? {
                ...court,
                slots: court.slots.map((slot, j) => 
                    j === slotIndex ? { ...slot, selected: !slot.selected } : slot
                )
            } : court
        ));
    };

    const toggleDayExpansion = (courtIndex, day) => {
        setCourts(prev => prev.map((court, i) => 
            i === courtIndex ? {
                ...court,
                expandedDays: court.expandedDays?.includes(day) 
                    ? court.expandedDays.filter(d => d !== day)
                    : [...(court.expandedDays || []), day]
            } : court
        ));
    };

    const togglePeriodExpansion = (courtIndex, day, period) => {
        const periodKey = `${day}-${period}`;
        setCourts(prev => prev.map((court, i) => 
            i === courtIndex ? {
                ...court,
                expandedPeriods: court.expandedPeriods?.includes(periodKey)
                    ? court.expandedPeriods.filter(p => p !== periodKey)
                    : [...(court.expandedPeriods || []), periodKey]
            } : court
        ));
    };

    const selectAllSlots = (courtIndex) => {
        setCourts(prev => prev.map((court, i) => 
            i === courtIndex ? {
                ...court,
                slots: court.slots.map(slot => ({ ...slot, selected: true }))
            } : court
        ));
    };

    const deselectAllSlots = (courtIndex) => {
        setCourts(prev => prev.map((court, i) => 
            i === courtIndex ? {
                ...court,
                slots: court.slots.map(slot => ({ ...slot, selected: false }))
            } : court
        ));
    };

    const updateCourt = (index, field, value) => {
        setCourts(prev => prev.map((court, i) => 
            i === index ? { ...court, [field]: value } : court
        ));
    };

    const removeCourt = (index) => {
        if (courts.length > 1) {
            setCourts(prev => prev.filter((_, i) => i !== index));
        }
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.name.trim() || !formData.location.trim()) {
                Alert.alert("Error", "Please fill in all required fields");
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const pickFacilityImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant permission to access your photo library');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setSelectedFacilityImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking facility image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const pickCourtImage = async (courtIndex) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant permission to access your photo library');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                updateCourt(courtIndex, 'courtImage', result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking court image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const uploadImageToCloudinary = async (imageUri) => {
        try {
            setUploadingImage(true);
            
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'facility-image.jpg',
            });
            formData.append('upload_preset', 'blogimages');
            formData.append('cloud_name', 'dt4dafjca');

            const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dt4dafjca/image/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.secure_url) {
                return uploadResult.secure_url;
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title="Create Facility" />

            <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressStep, currentStep >= 1 && styles.activeStep]}>
                        <Text style={[styles.stepNumber, currentStep >= 1 && styles.activeStepText]}>1</Text>
                    </View>
                    <View style={[styles.progressLine, currentStep >= 2 && styles.activeLine]} />
                    <View style={[styles.progressStep, currentStep >= 2 && styles.activeStep]}>
                        <Text style={[styles.stepNumber, currentStep >= 2 && styles.activeStepText]}>2</Text>
                    </View>
                </View>
                <Text style={styles.stepTitle}>
                    {currentStep === 1 ? 'Facility Details' : 'Courts & Slots'}
                </Text>
            </View>

            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {currentStep === 1 ? (
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Basic Information</Text>
                            
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Facility Image</Text>
                                <Pressable style={styles.imagePickerButton} onPress={pickFacilityImage}>
                                    {selectedFacilityImage ? (
                                        <View style={styles.selectedImageContainer}>
                                            <Image 
                                                source={{ uri: selectedFacilityImage.uri }} 
                                                style={styles.selectedImage}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.imageOverlay}>
                                                <Ionicons name="camera" size={24} color="white" />
                                                <Text style={styles.changeImageText}>Change Image</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Ionicons name="camera-outline" size={32} color={theme.colors.text.tertiary} />
                                            <Text style={styles.imagePlaceholderText}>Add Facility Image</Text>
                                        </View>
                                    )}
                                </Pressable>
                            </View>
                            
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Facility Name *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.name}
                                    onChangeText={(value) => updateField('name', value)}
                                    placeholder="Enter facility name"
                                    placeholderTextColor={theme.colors.text.tertiary}
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Location *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.location}
                                    onChangeText={(value) => updateField('location', value)}
                                    placeholder="Enter facility location"
                                    placeholderTextColor={theme.colors.text.tertiary}
                                />
                            </View>


                        </View>
                    ) : (
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Courts & Time Slots</Text>
                            <Text style={styles.sectionSubtitle}>
                                Add courts to your facility with predefined time slots
                            </Text>
                            
                            {courts.map((court, index) => (
                                <View key={index} style={styles.courtCard}>
                                    <View style={styles.courtHeader}>
                                        <Text style={styles.courtTitle}>Court {index + 1}</Text>
                                        {courts.length > 1 && (
                                            <Pressable 
                                                style={styles.removeButton}
                                                onPress={() => removeCourt(index)}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                                            </Pressable>
                                        )}
                                    </View>
                                    
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.fieldLabel}>Court Name *</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={court.courtName}
                                            onChangeText={(value) => updateCourt(index, 'courtName', value)}
                                            placeholder="e.g., Court A, Indoor Court 1"
                                            placeholderTextColor={theme.colors.text.tertiary}
                                        />
                                    </View>
                                    
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.fieldLabel}>Court Type</Text>
                                        <View style={styles.typeContainer}>
                                            {['Indoor', 'Outdoor'].map((type) => (
                                                <Pressable
                                                    key={type}
                                                    style={[
                                                        styles.typeButton,
                                                        court.courtType === type && styles.selectedType
                                                    ]}
                                                    onPress={() => updateCourt(index, 'courtType', type)}
                                                >
                                                    <Text style={[
                                                        styles.typeText,
                                                        court.courtType === type && styles.selectedTypeText
                                                    ]}>
                                                        {type}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>
                                    
                                    {/* Court Image */}
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.fieldLabel}>Court Image</Text>
                                        <Pressable style={styles.courtImagePickerButton} onPress={() => pickCourtImage(index)}>
                                            {court.courtImage ? (
                                                <View style={styles.selectedCourtImageContainer}>
                                                    <Image 
                                                        source={{ uri: court.courtImage.uri }} 
                                                        style={styles.selectedCourtImage}
                                                        resizeMode="cover"
                                                    />
                                                    <View style={styles.courtImageOverlay}>
                                                        <Ionicons name="camera" size={20} color="white" />
                                                        <Text style={styles.changeCourtImageText}>Change</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View style={styles.courtImagePlaceholder}>
                                                    <Ionicons name="camera-outline" size={24} color={theme.colors.text.tertiary} />
                                                    <Text style={styles.courtImagePlaceholderText}>Add Court Image</Text>
                                                </View>
                                            )}
                                        </Pressable>
                                    </View>
                                    
                                    <View style={styles.slotsPreview}>
                                        <View style={styles.slotsHeader}>
                                            <Text style={styles.slotsTitle}>Time Slots (7 Days)</Text>
                                            <View style={styles.slotsActions}>
                                                <Pressable 
                                                    style={styles.actionButton}
                                                    onPress={() => selectAllSlots(index)}
                                                >
                                                    <Text style={styles.actionText}>Select All</Text>
                                                </Pressable>
                                                <Pressable 
                                                    style={styles.actionButton}
                                                    onPress={() => deselectAllSlots(index)}
                                                >
                                                    <Text style={styles.actionText}>Clear All</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                        
                                        <Text style={styles.slotsInfo}>
                                            {court.slots.filter(slot => slot.selected).length} of {court.slots.length} slots selected
                                        </Text>
                                        
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                                            const daySlots = court.slots.filter(slot => slot.day === day);
                                            const selectedDaySlots = daySlots.filter(slot => slot.selected);
                                            
                                            const morningSlots = daySlots.filter(slot => slot.period === 'Morning');
                                            const afternoonSlots = daySlots.filter(slot => slot.period === 'Afternoon');
                                            const eveningSlots = daySlots.filter(slot => slot.period === 'Evening');
                                            const nightSlots = daySlots.filter(slot => slot.period === 'Night');
                                            
                                            const isDayExpanded = court.expandedDays?.includes(day) || false;
                                            
                                            return (
                                                <View key={day} style={styles.daySection}>
                                                    <Pressable 
                                                        style={styles.dayHeader}
                                                        onPress={() => toggleDayExpansion(index, day)}
                                                    >
                                                        <View style={styles.dayHeaderLeft}>
                                                            <Ionicons 
                                                                name={isDayExpanded ? "chevron-down" : "chevron-forward"} 
                                                                size={20} 
                                                                color={theme.colors.text.secondary} 
                                                            />
                                                            <Text style={styles.dayTitle}>{day}</Text>
                                                        </View>
                                                        <Text style={styles.daySlotCount}>
                                                            {selectedDaySlots.length}/{daySlots.length} selected
                                                        </Text>
                                                    </Pressable>
                                                    
                                                    {isDayExpanded && (
                                                        <View style={styles.slotsContainer}>
                                                        {morningSlots.length > 0 && (
                                                            <View style={styles.periodSection}>
                                                                <Pressable 
                                                                    style={styles.periodHeader}
                                                                    onPress={() => togglePeriodExpansion(index, day, 'Morning')}
                                                                >
                                                                    <Ionicons name="sunny" size={20} color="#FFA500" />
                                                                    <Text style={styles.periodTitle}>Morning (6 AM - 12 PM)</Text>
                                                                    <Ionicons 
                                                                        name={court.expandedPeriods?.includes(`${day}-Morning`) ? "chevron-up" : "chevron-down"} 
                                                                        size={20} 
                                                                        color={theme.colors.text.secondary}
                                                                    />
                                                                </Pressable>
                                                                {court.expandedPeriods?.includes(`${day}-Morning`) && (
                                                                    <View style={styles.slotsGrid}>
                                                                        {morningSlots.map((slot, slotIndex) => {
                                                                            const globalSlotIndex = court.slots.findIndex(s => s === slot);
                                                                            return (
                                                                                <Pressable
                                                                                    key={slotIndex}
                                                                                    style={[
                                                                                        styles.slotItem,
                                                                                        slot.selected && styles.selectedSlotItem
                                                                                    ]}
                                                                                    onPress={() => toggleSlot(index, globalSlotIndex)}
                                                                                >
                                                                                    <Text style={[
                                                                                        styles.slotTime,
                                                                                        slot.selected && styles.selectedSlotTime
                                                                                    ]}>
                                                                                        {slot.startTime} - {slot.endTime}
                                                                                    </Text>
                                                                                    {slot.selected && (
                                                                                        <Ionicons 
                                                                                            name="checkmark" 
                                                                                            size={16} 
                                                                                            color="white" 
                                                                                            style={styles.checkIcon}
                                                                                        />
                                                                                    )}
                                                                                </Pressable>
                                                                            );
                                                                        })}
                                                                    </View>
                                                                )}
                                                            </View>
                                                        )}
                                                        
                                                        {afternoonSlots.length > 0 && (
                                                            <View style={styles.periodSection}>
                                                                <Pressable 
                                                                    style={styles.periodHeader}
                                                                    onPress={() => togglePeriodExpansion(index, day, 'Afternoon')}
                                                                >
                                                                    <Ionicons name="partly-sunny" size={20} color="#FFD700" />
                                                                    <Text style={styles.periodTitle}>Afternoon (12 PM - 6 PM)</Text>
                                                                    <Ionicons 
                                                                        name={court.expandedPeriods?.includes(`${day}-Afternoon`) ? "chevron-up" : "chevron-down"} 
                                                                        size={20} 
                                                                        color={theme.colors.text.secondary}
                                                                    />
                                                                </Pressable>
                                                                {court.expandedPeriods?.includes(`${day}-Afternoon`) && (
                                                                    <View style={styles.slotsGrid}>
                                                                        {afternoonSlots.map((slot, slotIndex) => {
                                                                            const globalSlotIndex = court.slots.findIndex(s => s === slot);
                                                                            return (
                                                                                <Pressable
                                                                                    key={slotIndex}
                                                                                    style={[
                                                                                        styles.slotItem,
                                                                                        slot.selected && styles.selectedSlotItem
                                                                                    ]}
                                                                                    onPress={() => toggleSlot(index, globalSlotIndex)}
                                                                                >
                                                                                    <Text style={[
                                                                                        styles.slotTime,
                                                                                        slot.selected && styles.selectedSlotTime
                                                                                    ]}>
                                                                                        {slot.startTime} - {slot.endTime}
                                                                                    </Text>
                                                                                    {slot.selected && (
                                                                                        <Ionicons 
                                                                                            name="checkmark" 
                                                                                            size={16} 
                                                                                            color="white" 
                                                                                            style={styles.checkIcon}
                                                                                        />
                                                                                    )}
                                                                                </Pressable>
                                                                            );
                                                                        })}
                                                                    </View>
                                                                )}
                                                            </View>
                                                        )}
                                                        
                                                        {eveningSlots.length > 0 && (
                                                            <View style={styles.periodSection}>
                                                                <Pressable 
                                                                    style={styles.periodHeader}
                                                                    onPress={() => togglePeriodExpansion(index, day, 'Evening')}
                                                                >
                                                                    <Ionicons name="moon" size={20} color="#9370DB" />
                                                                    <Text style={styles.periodTitle}>Evening (6 PM - 10 PM)</Text>
                                                                    <Ionicons 
                                                                        name={court.expandedPeriods?.includes(`${day}-Evening`) ? "chevron-up" : "chevron-down"} 
                                                                        size={20} 
                                                                        color={theme.colors.text.secondary}
                                                                    />
                                                                </Pressable>
                                                                {court.expandedPeriods?.includes(`${day}-Evening`) && (
                                                                    <View style={styles.slotsGrid}>
                                                                        {eveningSlots.map((slot, slotIndex) => {
                                                                            const globalSlotIndex = court.slots.findIndex(s => s === slot);
                                                                            return (
                                                                                <Pressable
                                                                                    key={slotIndex}
                                                                                    style={[
                                                                                        styles.slotItem,
                                                                                        slot.selected && styles.selectedSlotItem
                                                                                    ]}
                                                                                    onPress={() => toggleSlot(index, globalSlotIndex)}
                                                                                >
                                                                                    <Text style={[
                                                                                        styles.slotTime,
                                                                                        slot.selected && styles.selectedSlotTime
                                                                                    ]}>
                                                                                        {slot.startTime} - {slot.endTime}
                                                                                    </Text>
                                                                                    {slot.selected && (
                                                                                        <Ionicons 
                                                                                            name="checkmark" 
                                                                                            size={16} 
                                                                                            color="white" 
                                                                                            style={styles.checkIcon}
                                                                                        />
                                                                                    )}
                                                                                </Pressable>
                                                                            );
                                                                        })}
                                                                    </View>
                                                                )}
                                                            </View>
                                                        )}
                                                        
                                                        {nightSlots.length > 0 && (
                                                            <View style={styles.periodSection}>
                                                                <Pressable 
                                                                    style={styles.periodHeader}
                                                                    onPress={() => togglePeriodExpansion(index, day, 'Night')}
                                                                >
                                                                    <Ionicons name="moon-outline" size={20} color="#4B0082" />
                                                                    <Text style={styles.periodTitle}>Night (10 PM - 6 AM)</Text>
                                                                    <Ionicons 
                                                                        name={court.expandedPeriods?.includes(`${day}-Night`) ? "chevron-up" : "chevron-down"} 
                                                                        size={20} 
                                                                        color={theme.colors.text.secondary}
                                                                    />
                                                                </Pressable>
                                                                {court.expandedPeriods?.includes(`${day}-Night`) && (
                                                                    <View style={styles.slotsGrid}>
                                                                        {nightSlots.map((slot, slotIndex) => {
                                                                            const globalSlotIndex = court.slots.findIndex(s => s === slot);
                                                                            return (
                                                                                <Pressable
                                                                                    key={slotIndex}
                                                                                    style={[
                                                                                        styles.slotItem,
                                                                                        slot.selected && styles.selectedSlotItem
                                                                                    ]}
                                                                                    onPress={() => toggleSlot(index, globalSlotIndex)}
                                                                                >
                                                                                    <Text style={[
                                                                                        styles.slotTime,
                                                                                        slot.selected && styles.selectedSlotTime
                                                                                    ]}>
                                                                                        {slot.startTime} - {slot.endTime}
                                                                                    </Text>
                                                                                    {slot.selected && (
                                                                                        <Ionicons 
                                                                                            name="checkmark" 
                                                                                            size={16} 
                                                                                            color="white" 
                                                                                            style={styles.checkIcon}
                                                                                        />
                                                                                    )}
                                                                                </Pressable>
                                                                            );
                                                                        })}
                                                                    </View>
                                                                )}
                                                            </View>
                                                        )}
                                                    </View>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                            
                            <Pressable style={styles.addCourtButton} onPress={addCourt}>
                                <Ionicons name="add-circle-outline" size={24} color={theme.colors.accent} />
                                <Text style={styles.addCourtText}>Add Another Court</Text>
                            </Pressable>
        </View>
                    )}

                    <View style={styles.buttonSection}>
                        {currentStep === 1 ? (
                            <Pressable style={styles.nextButton} onPress={nextStep}>
                                <Text style={styles.nextButtonText}>Next: Add Courts</Text>
                                <Ionicons name="arrow-forward" size={20} color="white" />
                            </Pressable>
                        ) : (
                            <View style={styles.buttonRow}>
                                <Pressable style={styles.backButton} onPress={prevStep}>
                                    <Ionicons name="arrow-back" size={20} color={theme.colors.accent} />
                                    <Text style={styles.backButtonText}>Back</Text>
                                </Pressable>
                                
                                <Pressable 
                                    style={[
                                        styles.saveButton, 
                                        loading && styles.disabledButton
                                    ]} 
                                    onPress={onSave}
                                    disabled={loading}
                                >
                                    <Text style={styles.saveButtonText}>
                                        {loading ? 'Creating...' : 'Create Facility'}
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

export default NewPost;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: hp(4),
    },
    progressSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    progressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: hp(1),
    },
    progressStep: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        backgroundColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeStep: {
        backgroundColor: theme.colors.accent,
    },
    stepNumber: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    activeStepText: {
        color: 'white',
    },
    progressLine: {
        width: wp(15),
        height: 2,
        backgroundColor: theme.colors.border,
        marginHorizontal: wp(2),
    },
    activeLine: {
        backgroundColor: theme.colors.accent,
    },
    stepTitle: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    formSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    sectionTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: hp(1),
    },
    sectionSubtitle: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        marginBottom: hp(3),
    },
    fieldContainer: {
        marginBottom: hp(3),
    },
    fieldLabel: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: hp(1),
    },
    textInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.surface,
    },
    textArea: {
        height: hp(12),
        textAlignVertical: 'top',
    },
    courtCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: hp(3),
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    courtHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    courtTitle: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    removeButton: {
        padding: hp(0.5),
    },
    typeContainer: {
        flexDirection: 'row',
        gap: wp(2),
    },
    typeButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        paddingVertical: hp(1.5),
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
    },
    selectedType: {
        borderColor: theme.colors.accent,
        backgroundColor: theme.colors.accent,
    },
    typeText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    selectedTypeText: {
        color: 'white',
    },
    slotsPreview: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        padding: hp(2),
        marginTop: hp(2),
    },
    slotsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    slotsTitle: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    slotsActions: {
        flexDirection: 'row',
        gap: wp(2),
    },
    actionButton: {
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.sm,
    },
    actionText: {
        fontSize: theme.fontSizes.xs,
        color: theme.colors.accent,
        fontWeight: '500',
    },
    slotsInfo: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        marginBottom: hp(1.5),
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(1.5),
    },
    slotsContainer: {
        paddingHorizontal: wp(3),
        paddingBottom: hp(2),
    },
    daySection: {
        marginBottom: hp(2),
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.5),
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    dayHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    dayTitle: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    daySlotCount: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    periodSection: {
        marginBottom: hp(2),
        paddingHorizontal: wp(2),
    },
    periodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: hp(1),
    },
    periodTitle: {
        fontSize: theme.fontSizes.sm,
        fontWeight: '600',
        color: theme.colors.text.primary,
        flex: 1,
        marginLeft: wp(2),
    },
    slotItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: wp(2),
        paddingVertical: hp(1),
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: wp(20),
    },
    selectedSlotItem: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },
    slotTime: {
        fontSize: theme.fontSizes.xs,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    selectedSlotTime: {
        color: 'white',
    },
    checkIcon: {
        marginLeft: wp(1),
    },
    addCourtButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        paddingVertical: hp(2),
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    addCourtText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.accent,
        marginLeft: wp(1),
    },
    buttonSection: {
        paddingHorizontal: wp(4),
        paddingTop: hp(2),
    },
    buttonRow: {
        flexDirection: 'row',
        gap: wp(3),
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.accent,
        borderRadius: theme.radius.lg,
        paddingVertical: hp(2),
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
        marginRight: wp(1),
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        paddingVertical: hp(2),
        paddingHorizontal: wp(4),
        borderWidth: 1,
        borderColor: theme.colors.border,
        flex: 1,
    },
    backButtonText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.accent,
        marginLeft: wp(1),
    },
    saveButton: {
        backgroundColor: theme.colors.accent,
        borderRadius: theme.radius.lg,
        paddingVertical: hp(2),
        alignItems: 'center',
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        flex: 2,
    },
    disabledButton: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
    },
    imagePickerButton: {
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
    },
    selectedImageContainer: {
        position: 'relative',
        height: hp(15),
        width: '100%',
    },
    selectedImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    changeImageText: {
        color: 'white',
        fontSize: theme.fontSizes.sm,
        fontWeight: '600',
        marginTop: hp(0.5),
    },
    imagePlaceholder: {
        height: hp(15),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    imagePlaceholderText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.tertiary,
        marginTop: hp(1),
    },
    courtImagePickerButton: {
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
    },
    selectedCourtImageContainer: {
        position: 'relative',
        height: hp(12),
        width: '100%',
    },
    selectedCourtImage: {
        width: '100%',
        height: '100%',
    },
    courtImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    changeCourtImageText: {
        color: 'white',
        fontSize: theme.fontSizes.xs,
        fontWeight: '600',
        marginTop: hp(0.5),
    },
    courtImagePlaceholder: {
        height: hp(12),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    courtImagePlaceholderText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.tertiary,
        marginTop: hp(0.5),
    },
});