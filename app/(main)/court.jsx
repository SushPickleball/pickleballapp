import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { hp, wp } from "@/helpers/common";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";

const Court = () => {
    const { user } = useAuth();
    const router = useRouter();
    const { id, facilityId } = useLocalSearchParams();
    
    const [court, setCourt] = useState(null);
    const [facility, setFacility] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDays, setExpandedDays] = useState([]);

    const generateDaysForSlots = (slots) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const result = [];
        
        const uniqueDays = [...new Set(slots.map(slot => slot.dayOfWeek))];
        
        uniqueDays.forEach(dayName => {
            const today = new Date();
            const targetDayIndex = days.indexOf(dayName);
            const currentDayIndex = today.getDay();
            
            let daysUntilTarget = targetDayIndex - currentDayIndex;
            if (daysUntilTarget <= 0) {
                daysUntilTarget += 7;
            }
            
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + daysUntilTarget);
            
            const dateKey = targetDate.toISOString().split('T')[0];
            const displayDate = targetDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
            });
            const shortDate = targetDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            result.push({
                dayName,
                dateKey,
                displayDate,
                shortDate
            });
        });
        
        return result;
    };

    const fetchCourtData = async () => {
        try {
            const { data: courtData, error: courtError } = await supabase
                .from('courts')
                .select('*')
                .eq('id', id)
                .single();

            if (courtError) {
                console.error('Error fetching court:', courtError);
                Alert.alert("Error", "Failed to load court");
                return;
            }

            setCourt(courtData);

            const { data: facilityData, error: facilityError } = await supabase
                .from('facilities')
                .select('*')
                .eq('id', facilityId)
                .single();

            if (!facilityError) {
                setFacility(facilityData);
            }

            const { data: slotsData, error: slotsError } = await supabase
                .from('courtSlots')
                .select('*')
                .eq('courtId', id)
                .order('dayOfWeek', { ascending: true });

            if (slotsError) {
                console.error('Error fetching slots:', slotsError);
            } else {
                setSlots(slotsData || []);
                const daysForSlots = generateDaysForSlots(slotsData || []);
                if (daysForSlots.length > 0) {
                    setExpandedDays([daysForSlots[0].dateKey]);
                }
            }

        } catch (error) {
            console.error('Error:', error);
            Alert.alert("Error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchCourtData();
        }
    }, [id]);

    const onSlotPress = (slot) => {
        if (slot.isBooked) {
            Alert.alert("Slot Booked", "This slot is already booked by another user.");
            return;
        }
        
        router.push({
            pathname: 'bookingConfirmation',
            params: { 
                slotId: slot.id,
                courtId: court.id,
                facilityId: facilityId
            }
        });
    };

    const toggleDayExpansion = (day) => {
        setExpandedDays(prev => 
            prev.includes(day) 
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };



    if (loading) {
        return (
            <ScreenWrapper bg="white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <Header title="Court" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading court...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!court) {
        return (
            <ScreenWrapper bg="white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <Header title="Court" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Court not found</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title={court.courtName} />

            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.courtSection}>
                    <View style={styles.courtHeader}>
                        <Ionicons name="tennisball" size={32} color={theme.colors.success} />
                        <Text style={styles.courtName}>{court.courtName}</Text>
                    </View>
                    
                    <View style={styles.courtDetails}>
                        <View style={styles.detailRow}>
                            <Ionicons name="business" size={20} color="#666" />
                            <Text style={styles.detailText}>{facility?.name || 'Unknown Facility'}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Ionicons name="location" size={20} color="#666" />
                            <Text style={styles.detailText}>{facility?.location || 'Unknown Location'}</Text>
                        </View>
                        
                        <View style={styles.courtTypeContainer}>
                            <Text style={styles.courtType}>{court.courtType}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.slotsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Time Slots</Text>
                        <Text style={styles.slotCount}>
                            {slots.filter(slot => !slot.isBooked).length} slots
                        </Text>
                    </View>
                    
                    {slots.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="time-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No slots available</Text>
                            <Text style={styles.emptySubtext}>Time slots will be added soon</Text>
                        </View>
                    ) : (
                        <View style={styles.slotsContainer}>
                            {generateDaysForSlots(slots).map((dateInfo) => {
                                const daySlots = slots.filter(slot => slot.dayOfWeek === dateInfo.dayName);
                                const availableDaySlots = daySlots.filter(slot => !slot.isBooked);
                                const isExpanded = expandedDays?.includes(dateInfo.dateKey) || false;
                                
                                if (daySlots.length === 0) return null;
                                
                                return (
                                    <View key={dateInfo.dateKey} style={styles.daySection}>
                                        <Pressable 
                                            style={styles.dayHeader}
                                            onPress={() => toggleDayExpansion(dateInfo.dateKey)}
                                        >
                                            <View style={styles.dayHeaderLeft}>
                                                <Ionicons 
                                                    name={isExpanded ? "chevron-down" : "chevron-forward"} 
                                                    size={20} 
                                                    color={theme.colors.text.secondary} 
                                                />
                                                <Text style={styles.dayTitle}>{dateInfo.displayDate}</Text>
                                            </View>
                                            <Text style={styles.daySlotCount}>
                                                {availableDaySlots.length} available
                                            </Text>
                                        </Pressable>
                                        
                                        {isExpanded && (
                                            <View style={styles.slotsContainer}>
                                                <View style={styles.slotsGrid}>
                                                    {daySlots.map((slot) => (
                                                        <Pressable
                                                            key={slot.id}
                                                            style={[
                                                                styles.slotCard,
                                                                slot.isBooked && styles.bookedSlotCard
                                                            ]}
                                                            onPress={() => onSlotPress(slot)}
                                                            disabled={slot.isBooked}
                                                        >
                                                            <View style={styles.slotHeader}>
                                                                <Ionicons 
                                                                    name={slot.isBooked ? "checkmark-circle" : "time"} 
                                                                    size={24} 
                                                                    color={slot.isBooked ? theme.colors.success : theme.colors.accent} 
                                                                />
                                                                <Text style={[
                                                                    styles.slotTime,
                                                                    slot.isBooked && styles.bookedSlotTime
                                                                ]}>
                                                                    {slot.startTime} - {slot.endTime}
                                                                </Text>
                                                            </View>
                                                            
                                                            <View style={styles.slotDetails}>
                                                                <Text style={[
                                                                    styles.slotDate,
                                                                    slot.isBooked && styles.bookedSlotDate
                                                                ]}>
                                                                    {dateInfo.shortDate}
                                                                </Text>
                                                                
                                                                <View style={styles.slotStatus}>
                                                                    <Text style={[
                                                                        styles.statusText,
                                                                        slot.isBooked ? styles.bookedStatus : styles.availableStatus
                                                                    ]}>
                                                                        {slot.isBooked ? 'Booked' : 'Available'}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                            
                                                            {!slot.isBooked && (
                                                                <View style={styles.slotFooter}>
                                                                    <Text style={styles.bookNow}>Tap to Book</Text>
                                                                    <Ionicons name="chevron-forward" size={16} color="#999" />
                                                                </View>
                                                            )}
                                                        </Pressable>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

export default Court;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
    courtSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    courtHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    courtName: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginLeft: wp(2),
    },
    courtDetails: {
        gap: hp(1),
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.secondary,
        marginLeft: wp(2),
        flex: 1,
    },
    courtTypeContainer: {
        alignSelf: 'flex-start',
        marginTop: hp(1),
    },
    courtType: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        backgroundColor: theme.colors.background,
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.sm,
    },
    slotsSection: {
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
    },
    slotCount: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        backgroundColor: theme.colors.background,
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.sm,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: hp(6),
    },
    emptyText: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: '#666',
        marginTop: hp(2),
        marginBottom: hp(0.5),
    },
    emptySubtext: {
        fontSize: theme.fontSizes.sm,
        color: '#999',
        textAlign: 'center',
    },
    slotsGrid: {
        gap: hp(2),
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
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    daySlotCount: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        backgroundColor: theme.colors.background,
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.sm,
    },
    slotCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: hp(2.5),
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    bookedSlotCard: {
        backgroundColor: theme.colors.background,
        opacity: 0.7,
    },
    slotHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    slotTime: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginLeft: wp(2),
        flex: 1,
    },
    bookedSlotTime: {
        color: theme.colors.text.secondary,
    },
    slotDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    slotDate: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
    },
    bookedSlotDate: {
        color: theme.colors.text.tertiary,
    },
    slotStatus: {
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: theme.fontSizes.xs,
        fontWeight: '600',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.sm,
    },
    availableStatus: {
        color: theme.colors.success,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
    },
    bookedStatus: {
        color: theme.colors.text.tertiary,
        backgroundColor: theme.colors.background,
    },
    slotFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: hp(1),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    bookNow: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.accent,
        fontWeight: '500',
    },
});
