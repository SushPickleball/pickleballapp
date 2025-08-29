import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { hp, wp } from "@/helpers/common";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";

const BookingConfirmation = () => {
    const { user } = useAuth();
    const router = useRouter();
    const { slotId, courtId, facilityId } = useLocalSearchParams();
    
    const [loading, setLoading] = useState(false);
    const [bookingData, setBookingData] = useState({
        slot: null,
        court: null,
        facility: null
    });

    React.useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                const { data: slotData, error: slotError } = await supabase
                    .from('courtSlots')
                    .select('*')
                    .eq('id', slotId)
                    .single();

                if (slotError) {
                    console.error('Error fetching slot:', slotError);
                    Alert.alert("Error", "Failed to load slot details");
                    return;
                }

                const { data: courtData, error: courtError } = await supabase
                    .from('courts')
                    .select('*')
                    .eq('id', courtId)
                    .single();

                if (courtError) {
                    console.error('Error fetching court:', courtError);
                    return;
                }

                const { data: facilityData, error: facilityError } = await supabase
                    .from('facilities')
                    .select('*')
                    .eq('id', facilityId)
                    .single();

                if (facilityError) {
                    console.error('Error fetching facility:', facilityError);
                    return;
                }

                setBookingData({
                    slot: slotData,
                    court: courtData,
                    facility: facilityData
                });

            } catch (error) {
                console.error('Error:', error);
                Alert.alert("Error", "Something went wrong");
            }
        };

        if (slotId && courtId && facilityId) {
            fetchBookingDetails();
        }
    }, [slotId, courtId, facilityId]);

    const getNextDateForDay = (dayName) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const todayDay = today.getDay();
        const targetDay = days.indexOf(dayName);
        
        let daysToAdd = targetDay - todayDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysToAdd);
        
        return targetDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const onConfirmBooking = async () => {
        if (!bookingData.slot || !bookingData.court || !bookingData.facility) {
            Alert.alert("Error", "Booking details not loaded");
            return;
        }

        setLoading(true);

        try {
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    userId: user.id,
                    courtSlotId: parseInt(slotId),
                    bookingTime: new Date().toISOString(),
                    status: true
                })
                .select()
                .single();

            if (bookingError) {
                console.error('Booking creation error:', bookingError);
                Alert.alert("Error", "Failed to create booking");
                return;
            }

            const { error: slotUpdateError } = await supabase
                .from('courtSlots')
                .update({ isBooked: true })
                .eq('id', slotId);

            if (slotUpdateError) {
                console.error('Slot update error:', slotUpdateError);
               
            }

            Alert.alert(
                "Booking Confirmed!", 
                "Your slot has been successfully booked.",
                [
                    { 
                        text: "View My Bookings", 
                        onPress: () => router.push('bookings') 
                    },
                    { 
                        text: "OK", 
                        onPress: () => router.back() 
                    }
                ]
            );

        } catch (error) {
            console.error('Error creating booking:', error);
            Alert.alert("Error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!bookingData.slot || !bookingData.court || !bookingData.facility) {
        return (
            <ScreenWrapper bg="white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <Header title="Confirm Booking" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading booking details...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title="Confirm Booking" />

            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
               =
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Booking Summary</Text>
                    
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Ionicons name="business" size={20} color="#666" />
                            <Text style={styles.summaryLabel}>Facility:</Text>
                            <Text style={styles.summaryValue}>{bookingData.facility.name}</Text>
                        </View>
                        
                        <View style={styles.summaryRow}>
                            <Ionicons name="location" size={20} color="#666" />
                            <Text style={styles.summaryLabel}>Location:</Text>
                            <Text style={styles.summaryValue}>{bookingData.facility.location}</Text>
                        </View>
                        
                        <View style={styles.summaryRow}>
                            <Ionicons name="tennisball" size={20} color="#666" />
                            <Text style={styles.summaryLabel}>Court:</Text>
                            <Text style={styles.summaryValue}>{bookingData.court.courtName}</Text>
                        </View>
                        
                        <View style={styles.summaryRow}>
                            <Ionicons name="time" size={20} color="#666" />
                            <Text style={styles.summaryLabel}>Time:</Text>
                            <Text style={styles.summaryValue}>
                                {bookingData.slot.startTime} - {bookingData.slot.endTime}
                            </Text>
                        </View>
                        
                        <View style={styles.summaryRow}>
                            <Ionicons name="calendar" size={20} color="#666" />
                            <Text style={styles.summaryLabel}>Date:</Text>
                            <Text style={styles.summaryValue}>
                                {getNextDateForDay(bookingData.slot.dayOfWeek)}
                            </Text>
                        </View>
                    </View>
                </View>

              
                <View style={styles.userSection}>
                    <Text style={styles.sectionTitle}>Booking For</Text>
                    <View style={styles.userCard}>
                        <View style={styles.userInfo}>
                            <Ionicons name="person" size={24} color={theme.colors.accent} />
                            <View style={styles.userDetails}>
                                <Text style={styles.userName}>
                                    {user?.name || user?.email?.split('@')[0] || 'User'}
                                </Text>
                                <Text style={styles.userEmail}>{user?.email}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.termsSection}>
                    <Text style={styles.sectionTitle}>Important Information</Text>
                    <View style={styles.termsCard}>
                        <View style={styles.termItem}>
                            <Ionicons name="information-circle" size={16} color={theme.colors.warning} />
                            <Text style={styles.termText}>
                                Please arrive 5 minutes before your scheduled time
                            </Text>
                        </View>
                        <View style={styles.termItem}>
                            <Ionicons name="information-circle" size={16} color={theme.colors.warning} />
                            <Text style={styles.termText}>
                                Cancellations must be made at least 2 hours in advance
                            </Text>
                        </View>
                        <View style={styles.termItem}>
                            <Ionicons name="information-circle" size={16} color={theme.colors.warning} />
                            <Text style={styles.termText}>
                                Bring your own equipment (rackets, balls)
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

           
            <View style={styles.buttonSection}>
                <Pressable 
                    style={[styles.confirmButton, loading && styles.disabledButton]} 
                    onPress={onConfirmBooking}
                    disabled={loading}
                >
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.confirmButtonText}>
                        {loading ? 'Confirming...' : 'Confirm Booking'}
                    </Text>
                </Pressable>
                
                <Pressable 
                    style={styles.cancelButton} 
                    onPress={() => router.back()}
                    disabled={loading}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
            </View>
        </ScreenWrapper>
    );
};

export default BookingConfirmation;

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
    summarySection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    sectionTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: hp(2),
    },
    summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: hp(3),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    summaryLabel: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginLeft: wp(2),
        width: wp(20),
    },
    summaryValue: {
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.primary,
        flex: 1,
        marginLeft: wp(2),
    },
    userSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
    },
    userCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: hp(3),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userDetails: {
        marginLeft: wp(2),
        flex: 1,
    },
    userName: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    userEmail: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        marginTop: hp(0.5),
    },
    termsSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
    },
    termsCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        padding: hp(3),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    termItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: hp(1.5),
    },
    termText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        marginLeft: wp(2),
        flex: 1,
        lineHeight: 20,
    },
    buttonSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: 'white',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.success,
        borderRadius: theme.radius.lg,
        paddingVertical: hp(2.5),
        marginBottom: hp(2),
        shadowColor: theme.colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.6,
    },
    confirmButtonText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
        marginLeft: wp(1),
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: hp(2),
    },
    cancelButtonText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
});
