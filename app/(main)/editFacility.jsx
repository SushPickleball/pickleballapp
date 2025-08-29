import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { hp, wp } from "@/helpers/common";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const EditFacility = () => {
    const { user } = useAuth();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    
    const [facility, setFacility] = useState(null);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        location: ''
    });

    const fetchFacilityData = async () => {
        try {
            setLoading(true);
            
            const { data: facilityData, error: facilityError } = await supabase
                .from('facilities')
                .select('*')
                .eq('id', id)
                .single();

            if (facilityError) {
                console.error('Error fetching facility:', facilityError);
                Alert.alert("Error", "Failed to load facility");
                router.back();
                return;
            }

            if (facilityData.ownerId && facilityData.ownerId !== user.id) {
                Alert.alert("Access Denied", "You can only edit your own facilities");
                router.back();
                return;
            }

            if (!facilityData.ownerId) {
                console.log('Setting ownerId for old facility');
                const { error: updateError } = await supabase
                    .from('facilities')
                    .update({ ownerId: user.id })
                    .eq('id', id);
                
                if (updateError) {
                    console.error('Error setting ownerId:', updateError);
                } else {
                    facilityData.ownerId = user.id;
                }
            }

            const { data: courtsData, error: courtsError } = await supabase
                .from('courts')
                .select(`
                    *,
                    courtSlots (*)
                `)
                .eq('facilityId', id)
                .order('created_at', { ascending: true });

            if (courtsError) {
                console.error('Error fetching courts:', courtsError);
                Alert.alert("Error", "Failed to load courts");
                return;
            }

            const transformedCourts = courtsData.map(court => {
                const slots = court.courtSlots || [];
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                
                const slotsByDay = {};
                days.forEach(day => {
                    slotsByDay[day] = slots.filter(slot => slot.dayOfWeek === day);
                });

                const allSlots = [];
                days.forEach(day => {
                    const daySlots = slotsByDay[day];
                    if (daySlots.length > 0) {
                        daySlots.forEach(slot => {
                            let period = 'Morning';
                            const hour = parseInt(slot.startTime.split(':')[0]);
                            if (hour >= 12 && hour < 18) period = 'Afternoon';
                            else if (hour >= 18 && hour < 22) period = 'Evening';
                            else if (hour >= 22 || hour < 6) period = 'Night';
                            
                            allSlots.push({
                                id: slot.id,
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                                day: slot.dayOfWeek,
                                period: period,
                                selected: true,
                                isBooked: slot.isBooked
                            });
                        });
                    } else {
                        const timeSlots = [
                            { startTime: '09:00', endTime: '10:00' },
                            { startTime: '10:00', endTime: '11:00' },
                            { startTime: '11:00', endTime: '12:00' },
                            { startTime: '14:00', endTime: '15:00' },
                            { startTime: '15:00', endTime: '16:00' },
                            { startTime: '16:00', endTime: '17:00' },
                            { startTime: '17:00', endTime: '18:00' },
                            { startTime: '18:00', endTime: '19:00' },
                            { startTime: '19:00', endTime: '20:00' },
                        ];
                        timeSlots.forEach(timeSlot => {
                            allSlots.push({
                                ...timeSlot,
                                day: day,
                                selected: false
                            });
                        });
                    }
                });

                return {
                    id: court.id,
                    courtName: court.courtName,
                    courtType: court.courtType,
                    courtImage: court.image ? { uri: court.image } : null,
                    slots: allSlots,
                                    expandedDays: ['Monday'],
                expandedPeriods: ['Monday-Morning']
                };
            });

            setFacility(facilityData);
            setCourts(transformedCourts);
            setFormData({
                name: facilityData.name || '',
                location: facilityData.location || ''
            });
        } catch (error) {
            console.error('Error:', error);
            Alert.alert("Error", "Something went wrong");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchFacilityData();
        }
    }, [id]);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const pickCourtImage = async (courtIndex) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                updateCourt(courtIndex, 'courtImage', result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking court image:', error);
            Alert.alert("Error", "Failed to pick court image");
        }
    };

    const uploadImageToCloudinary = async (imageUri) => {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'facility.jpg',
            });
            formData.append('upload_preset', 'blogimages');
            formData.append('cloud_name', 'dt4dafjca');

            const response = await fetch('https://api.cloudinary.com/v1_1/dt4dafjca/image/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw error;
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



    const removeSlot = (courtIndex, slotIndex) => {
        setCourts(prev => prev.map((court, i) => 
            i === courtIndex ? {
                ...court,
                slots: court.slots.filter((_, j) => j !== slotIndex)
            } : court
        ));
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

    const generateAllPossibleSlots = (day) => {
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

        return allSlots;
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

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const onSave = async () => {
        if (!formData.name.trim() || !formData.location.trim()) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        if (courts.length === 0) {
            Alert.alert("Error", "Please add at least one court");
            return;
        }

        for (let i = 0; i < courts.length; i++) {
            if (!courts[i].courtName.trim()) {
                Alert.alert("Error", `Please enter a name for Court ${i + 1}`);
                return;
            }
        }

        setSaving(true);

        try {
            let imageUrl = facility.image;

            if (selectedImage) {
                setUploadingImage(true);
                imageUrl = await uploadImageToCloudinary(selectedImage.uri);
                setUploadingImage(false);
            }

            const { error: facilityError } = await supabase
                .from('facilities')
                .update({ 
                    name: formData.name.trim(), 
                    location: formData.location.trim(), 
                    image: imageUrl 
                })
                .eq('id', id)
                .eq('ownerId', user.id);

            if (facilityError) {
                console.error('Facility update error:', facilityError);
                Alert.alert("Error", "Failed to update facility");
                return;
            }

            for (const court of courts) {
                if (court.id) {
                    let courtImageUrl = court.courtImage?.uri || court.courtImage;
                    
                    if (court.courtImage && court.courtImage.uri && !court.courtImage.uri.startsWith('http')) {
                        courtImageUrl = await uploadImageToCloudinary(court.courtImage.uri);
                    }

                    const { error: courtError } = await supabase
                        .from('courts')
                        .update({
                            courtName: court.courtName.trim(),
                            courtType: court.courtType,
                            image: courtImageUrl
                        })
                        .eq('id', court.id);

                    if (courtError) {
                        console.error('Court update error:', courtError);
                        continue;
                    }
                } else {
                    let courtImageUrl = null;
                    if (court.courtImage && court.courtImage.uri && !court.courtImage.uri.startsWith('http')) {
                        courtImageUrl = await uploadImageToCloudinary(court.courtImage.uri);
                    }

                    const { data: courtData, error: courtError } = await supabase
                        .from('courts')
                        .insert({
                            facilityId: id,
                            courtName: court.courtName.trim(),
                            courtType: court.courtType,
                            image: courtImageUrl
                        })
                        .select()
                        .single();

                    if (courtError) {
                        console.error('Court creation error:', courtError);
                        continue;
                    }

                    court.id = courtData.id;
                }

                const selectedSlots = court.slots.filter(slot => slot.selected);
                
                await supabase
                    .from('courtSlots')
                    .delete()
                    .eq('courtId', court.id);

                for (const slot of selectedSlots) {
                    const slotInsertData = {
                        courtId: court.id,
                        dayOfWeek: slot.day,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isBooked: false
                    };

                    const { error: slotError } = await supabase
                        .from('courtSlots')
                        .insert(slotInsertData);

                    if (slotError) {
                        console.error('Slot insert error:', slotError);
                    }
                }
            }

            Alert.alert("Success", "Facility updated successfully", [
                { text: "OK", onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('Error updating facility:', error);
            Alert.alert("Error", "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper bg="white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <Header title="Edit Facility" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading facility...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title="Edit Facility" />

            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Facility Information</Text>
                        
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Facility Image</Text>
                            <Pressable style={styles.imagePickerButton} onPress={pickImage}>
                                {(selectedImage || facility?.image) ? (
                                    <View style={styles.selectedImageContainer}>
                                        <Image 
                                            source={{ uri: selectedImage?.uri || facility.image }} 
                                            style={styles.selectedImage}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.imageOverlay}>
                                            <Ionicons name="camera" size={20} color="white" />
                                            <Text style={styles.changeImageText}>Change</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="camera-outline" size={24} color={theme.colors.text.tertiary} />
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

                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Courts & Time Slots</Text>
                            <Pressable style={styles.addCourtButton} onPress={addCourt}>
                                <Ionicons name="add" size={20} color="white" />
                                <Text style={styles.addCourtText}>Add Court</Text>
                            </Pressable>
                        </View>
                        
                        <Text style={styles.sectionSubtitle}>
                            Edit courts and their time slots. All possible time slots are shown below - existing slots are highlighted in blue.
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
                                
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.fieldLabel}>Court Image</Text>
                                    <Pressable style={styles.courtImagePickerButton} onPress={() => pickCourtImage(index)}>
                                        {court.courtImage ? (
                                            <View style={styles.selectedCourtImageContainer}>
                                                <Image 
                                                    source={{ uri: court.courtImage.uri || court.courtImage }} 
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
                                    
                                                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                                        const daySlots = court.slots.filter(slot => slot.day === day);
                                        const selectedDaySlots = daySlots.filter(slot => slot.selected);
                                        
                                        const allPossibleSlots = generateAllPossibleSlots(day);
                                        
                                        const morningSlots = allPossibleSlots.filter(slot => slot.period === 'Morning');
                                        const afternoonSlots = allPossibleSlots.filter(slot => slot.period === 'Afternoon');
                                        const eveningSlots = allPossibleSlots.filter(slot => slot.period === 'Evening');
                                        const nightSlots = allPossibleSlots.filter(slot => slot.period === 'Night');
                                        
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
                                                        {selectedDaySlots.length}/{allPossibleSlots.length} selected
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
                                                                        const existingSlot = court.slots.find(s => 
                                                                            s.day === slot.day && 
                                                                            s.period === slot.period && 
                                                                            s.startTime === slot.startTime && 
                                                                            s.endTime === slot.endTime
                                                                        );
                                                                        
                                                                        const isExisting = !!existingSlot;
                                                                        // Check if slot is selected (either existing or newly added)
                                                                        const isSelected = existingSlot?.selected || 
                                                                            court.slots.some(s => 
                                                                                s.day === slot.day && 
                                                                                s.period === slot.period && 
                                                                                s.startTime === slot.startTime && 
                                                                                s.endTime === slot.endTime && 
                                                                                s.selected
                                                                            );
                                                                        
                                                                        return (
                                                                            <View key={slotIndex} style={styles.slotContainer}>
                                                                                <Pressable
                                                                                    style={[
                                                                                        styles.slotButton,
                                                                                        isSelected && styles.selectedSlot,
                                                                                        isExisting && styles.existingSlot
                                                                                    ]}
                                                                                    onPress={() => {
                                                                                        if (existingSlot) {
                                                                                            // Toggle existing slot
                                                                                            const globalSlotIndex = court.slots.findIndex(s => s === existingSlot);
                                                                                            toggleSlot(index, globalSlotIndex);
                                                                                        } else {
                                                                                            // Add new slot to the court
                                                                                            const newSlot = {
                                                                                                ...slot,
                                                                                                selected: true
                                                                                            };
                                                                                            setCourts(prev => prev.map((court, i) => 
                                                                                                i === index ? {
                                                                                                    ...court,
                                                                                                    slots: [...court.slots, newSlot]
                                                                                                } : court
                                                                                            ));
                                                                                        }
                                                                                    }}
                                                                                    disabled={existingSlot?.isBooked}
                                                                                >
                                                                                    <Text style={[
                                                                                        styles.slotText,
                                                                                        isSelected && styles.selectedSlotText,
                                                                                        isExisting && styles.existingSlotText
                                                                                    ]}>
                                                                                        {slot.startTime} - {slot.endTime}
                                                                                    </Text>
                                                                                    {isSelected && (
                                                                                        <Ionicons 
                                                                                            name="checkmark" 
                                                                                            size={16} 
                                                                                            color="white" 
                                                                                        />
                                                                                    )}
                                                                                </Pressable>
                                                                                {isExisting && (
                                                                                    <Pressable
                                                                                        style={styles.removeSlotButton}
                                                                                        onPress={() => {
                                                                                            const globalSlotIndex = court.slots.findIndex(s => s === existingSlot);
                                                                                            removeSlot(index, globalSlotIndex);
                                                                                        }}
                                                                                    >
                                                                                        <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                                                                                    </Pressable>
                                                                                )}
                                                                            </View>
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
                                                                        // Check if this slot exists in the database
                                                                        const existingSlot = court.slots.find(s => 
                                                                            s.day === slot.day && 
                                                                            s.period === slot.period && 
                                                                            s.startTime === slot.startTime && 
                                                                            s.endTime === slot.endTime
                                                                        );
                                                                        
                                                                        const isExisting = !!existingSlot;
                                                                        // Check if slot is selected (either existing or newly added)
                                                                        const isSelected = existingSlot?.selected || 
                                                                            court.slots.some(s => 
                                                                                s.day === slot.day && 
                                                                                s.period === slot.period && 
                                                                                s.startTime === slot.startTime && 
                                                                                s.endTime === slot.endTime && 
                                                                                s.selected
                                                                            );
                                                                        
                                                                        return (
                                                                            <View key={slotIndex} style={styles.slotContainer}>
                                                                                <Pressable
                                                                                    style={[
                                                                                        styles.slotButton,
                                                                                        isSelected && styles.selectedSlot,
                                                                                        isExisting && styles.existingSlot
                                                                                    ]}
                                                                                    onPress={() => {
                                                                                        if (existingSlot) {
                                                                                            // Toggle existing slot
                                                                                            const globalSlotIndex = court.slots.findIndex(s => s === existingSlot);
                                                                                            toggleSlot(index, globalSlotIndex);
                                                                                        } else {
                                                                                            // Add new slot to the court
                                                                                            const newSlot = {
                                                                                                ...slot,
                                                                                                selected: true
                                                                                            };
                                                                                            setCourts(prev => prev.map((court, i) => 
                                                                                                i === index ? {
                                                                                                    ...court,
                                                                                                    slots: [...court.slots, newSlot]
                                                                                                } : court
                                                                                            ));
                                                                                        }
                                                                                    }}
                                                                                    disabled={existingSlot?.isBooked}
                                                                                >
                                                                                    <Text style={[
                                                                                        styles.slotText,
                                                                                        isSelected && styles.selectedSlotText,
                                                                                        isExisting && styles.existingSlotText
                                                                                    ]}>
                                                                                        {slot.startTime} - {slot.endTime}
                                                                                    </Text>
                                                                                    {isSelected && (
                                                                                        <Ionicons 
                                                                                            name="checkmark" 
                                                                                            size={16} 
                                                                                            color="white" 
                                                                                        />
                                                                                    )}
                                                                                </Pressable>
                                                                                {isExisting && (
                                                                                    <Pressable
                                                                                        style={styles.removeSlotButton}
                                                                                        onPress={() => {
                                                                                            const globalSlotIndex = court.slots.findIndex(s => s === existingSlot);
                                                                                            removeSlot(index, globalSlotIndex);
                                                                                        }}
                                                                                    >
                                                                                        <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                                                                                    </Pressable>
                                                                                )}
                                                                            </View>
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
                                                                        // Check if this slot exists in the database
                                                                        const existingSlot = court.slots.find(s => 
                                                                            s.day === slot.day && 
                                                                            s.period === slot.period && 
                                                                            s.startTime === slot.startTime && 
                                                                            s.endTime === slot.endTime
                                                                        );
                                                                        
                                                                        const isExisting = !!existingSlot;
                                                                        // Check if slot is selected (either existing or newly added)
                                                                        const isSelected = existingSlot?.selected || 
                                                                            court.slots.some(s => 
                                                                                s.day === slot.day && 
                                                                                s.period === slot.period && 
                                                                                s.startTime === slot.startTime && 
                                                                                s.endTime === slot.endTime && 
                                                                                s.selected
                                                                            );
                                                                        
                                                                        return (
                                                                            <View key={slotIndex} style={styles.slotContainer}>
                                                                                <Pressable
                                                                                    style={[
                                                                                        styles.slotButton,
                                                                                        isSelected && styles.selectedSlot,
                                                                                        isExisting && styles.existingSlot
                                                                                    ]}
                                                                                    onPress={() => {
                                                                                        if (existingSlot) {
                                                                                            // Toggle existing slot
                                                                                            const globalSlotIndex = court.slots.findIndex(s => s === existingSlot);
                                                                                            toggleSlot(index, globalSlotIndex);
                                                                                        } else {
                                                                                            // Add new slot to the court
                                                                                            const newSlot = {
                                                                                                ...slot,
                                                                                                selected: true
                                                                                            };
                                                                                            setCourts(prev => prev.map((court, i) => 
                                                                                                i === index ? {
                                                                                                    ...court,
                                                                                                    slots: [...court.slots, newSlot]
                                                                                                } : court
                                                                                            ));
                                                                                        }
                                                                                    }}
                                                                                    disabled={existingSlot?.isBooked}
                                                                                >
                                                                                    <Text style={[
                                                                                        styles.slotText,
                                                                                        isSelected && styles.selectedSlotText,
                                                                                        isExisting && styles.existingSlotText
                                                                                    ]}>
                                                                                        {slot.startTime} - {slot.endTime}
                                                                                    </Text>
                                                                                    {isSelected && (
                                                                                        <Ionicons 
                                                                                            name="checkmark" 
                                                                                            size={16} 
                                                                                            color="white" 
                                                                                        />
                                                                                    )}
                                                                                </Pressable>
                                                                                {isExisting && (
                                                                                    <Pressable
                                                                                        style={styles.removeSlotButton}
                                                                                        onPress={() => {
                                                                                            const globalSlotIndex = court.slots.findIndex(s => s === existingSlot);
                                                                                            removeSlot(index, globalSlotIndex);
                                                                                        }}
                                                                                    >
                                                                                        <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                                                                                    </Pressable>
                                                                                )}
                                                                            </View>
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
                                                                    color={theme.colors.error}
                                                                />
                                                            </Pressable>
                                                            {court.expandedPeriods?.includes(`${day}-Night`) && (
                                                                <View style={styles.slotsGrid}>
                                                                    {nightSlots.map((slot, slotIndex) => {
                                                                        // Check if this slot exists in the database
                                                                        const existingSlot = court.slots.find(s => 
                                                                            s.day === slot.day && 
                                                                            s.period === slot.period && 
                                                                            s.startTime === slot.startTime && 
                                                                            s.endTime === slot.endTime
                                                                        );
                                                                        
                                                                        const isExisting = !!existingSlot;
                                                                        // Check if slot is selected (either existing or newly added)
                                                                        const isSelected = existingSlot?.selected || 
                                                                            court.slots.some(s => 
                                                                                s.day === slot.day && 
                                                                                s.period === slot.period && 
                                                                                s.startTime === slot.startTime && 
                                                                                s.endTime === slot.endTime && 
                                                                                s.selected
                                                                            );
                                                                        
                                                                        return (
                                                                            <View key={slotIndex} style={styles.slotContainer}>
                                                                                <Pressable
                                                                                    style={[
                                                                                        styles.slotButton,
                                                                                        isSelected && styles.selectedSlot,
                                                                                        isExisting && styles.existingSlot
                                                                                    ]}
                                                                                    onPress={() => {
                                                                                        if (existingSlot) {
                                                                                            // Toggle existing slot
                                                                                            const globalSlotIndex = court.slots.findIndex(s => s === existingSlot);
                                                                                            toggleSlot(index, globalSlotIndex);
                                                                                        } else {
                                                                                            // Add new slot to the court
                                                                                            const newSlot = {
                                                                                                ...slot,
                                                                                                selected: true
                                                                                            };
                                                                                            setCourts(prev => prev.map((court, i) => 
                                                                                                i === index ? {
                                                                                                    ...court,
                                                                                                    slots: [...court.slots, newSlot]
                                                                                                } : court
                                                                                            ));
                                                                                        }
                                                                                    }}
                                                                                    disabled={existingSlot?.isBooked}
                                                                                >
                                                                                    <Text style={[
                                                                                        styles.slotText,
                                                                                        isSelected && styles.selectedSlotText,
                                                                                        isExisting && styles.existingSlotText
                                                                                    ]}>
                                                                                        {slot.startTime} - {slot.endTime}
                                                                                    </Text>
                                                                                    {isSelected && (
                                                                                        <Ionicons 
                                                                                            name="checkmark" 
                                                                                            size={16} 
                                                                                            color="white" 
                                                                                        />
                                                                                    )}
                                                                                </Pressable>
                                                                                {isExisting && (
                                                                                    <Pressable
                                                                                        style={styles.removeSlotButton}
                                                                                        onPress={() => {
                                                                                            const globalSlotIndex = court.slots.findIndex(s => s === existingSlot);
                                                                                            removeSlot(index, globalSlotIndex);
                                                                                        }}
                                                                                    >
                                                                                        <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                                                                                    </Pressable>
                                                                                )}
                                                                            </View>
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
                    </View>
                </ScrollView>

                <View style={styles.buttonSection}>
                    <Pressable 
                        style={[styles.saveButton, (saving || uploadingImage) && styles.disabledButton]} 
                        onPress={onSave}
                        disabled={saving || uploadingImage}
                    >
                        <Ionicons name="save" size={20} color="white" />
                        <Text style={styles.saveButtonText}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

export default EditFacility;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: hp(20),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    formSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    sectionTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: hp(1),
    },
    sectionSubtitle: {
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.secondary,
        marginBottom: hp(3),
    },
    addCourtButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        backgroundColor: theme.colors.accent,
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderRadius: theme.radius.lg,
    },
    addCourtText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
    },
    fieldContainer: {
        marginBottom: hp(3),
    },
    fieldLabel: {
        fontSize: theme.fontSizes.base,
        fontWeight: '500',
        color: theme.colors.text.primary,
        marginBottom: hp(1),
    },
    textInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: wp(3),
        paddingVertical: hp(2.5),
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.surface,
    },
    imagePickerButton: {
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    imagePlaceholder: {
        height: hp(20),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
    },
    imagePlaceholderText: {
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.tertiary,
        marginTop: hp(1),
    },
    selectedImageContainer: {
        height: hp(20),
        position: 'relative',
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
        flexDirection: 'row',
        gap: wp(2),
    },
    changeImageText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
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
        padding: wp(2),
    },
    typeContainer: {
        flexDirection: 'row',
        gap: wp(2),
    },
    typeButton: {
        flex: 1,
        paddingVertical: hp(2),
        paddingHorizontal: wp(4),
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    selectedType: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },
    typeText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    selectedTypeText: {
        color: 'white',
    },
    courtImagePickerButton: {
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    courtImagePlaceholder: {
        height: hp(15),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
    },
    courtImagePlaceholderText: {
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.tertiary,
        marginTop: hp(1),
    },
    selectedCourtImageContainer: {
        height: hp(15),
        position: 'relative',
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
        flexDirection: 'row',
        gap: wp(2),
    },
    changeCourtImageText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
    },
    slotsPreview: {
        marginTop: hp(2),
    },
    slotsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
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
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    actionText: {
        fontSize: theme.fontSizes.sm,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    daySection: {
        marginBottom: hp(2),
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(3),
        backgroundColor: theme.colors.surface,
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
    dayHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },

    slotsContainer: {
        paddingHorizontal: wp(3),
        paddingBottom: hp(2),
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(2),
    },
    slotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
    },
    removeSlotButton: {
        padding: hp(0.5),
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background,
    },
    slotButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        paddingHorizontal: wp(3),
        paddingVertical: hp(1.5),
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: wp(25),
        justifyContent: 'center',
    },
    selectedSlot: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },
    existingSlot: {
        backgroundColor: theme.colors.accent + '20',
        borderColor: theme.colors.accent,
    },
    slotText: {
        fontSize: theme.fontSizes.sm,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    selectedSlotText: {
        color: 'white',
    },
    existingSlotText: {
        color: theme.colors.accent,
        fontWeight: '600',
    },
    buttonSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(2),
        backgroundColor: theme.colors.accent,
        paddingVertical: hp(3),
        borderRadius: theme.radius.lg,
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledButton: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: 'white',
    },
});
