import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';

import Header from '@/components/Header';
import ScreenWrapper from '@/components/ScreenWrapper';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { hp, wp } from '@/helpers/common';
import { supabase } from '@/lib/supabase';

const MyFacilityBookings = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyFacilityBookings = async () => {
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    courtSlots (
                        *,
                        courts (
                            *,
                            facilities (*)
                        )
                    ),
                    users (
                        id,
                        email,
                        name
                    )
                `)
                .eq('courtSlots.courts.facilities.ownerId', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching facility bookings:', error);
                Alert.alert("Error", "Failed to load bookings");
                return;
            }

            setBookings(data || []);
        } catch (error) {
            console.error('Error:', error);
            Alert.alert("Error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyFacilityBookings();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchMyFacilityBookings();
    }, []);

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

    const getBookingStatus = (booking) => {
        if (booking.status === false) {
            return { text: 'Cancelled', color: theme.colors.error, icon: 'close-circle' };
        }
        return { text: 'Active', color: theme.colors.success, icon: 'checkmark-circle' };
    };

    const onCancelBooking = async (booking) => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking? This will make the slot available again.",
            [
                { text: "No", style: "cancel" },
                { 
                    text: "Yes, Cancel", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error: bookingError } = await supabase
                                .from('bookings')
                                .update({ status: false })
                                .eq('id', booking.id);

                            if (bookingError) {
                                console.error('Error cancelling booking:', bookingError);
                                Alert.alert("Error", "Failed to cancel booking");
                                return;
                            }

                            const { error: slotError } = await supabase
                                .from('courtSlots')
                                .update({ isBooked: false })
                                .eq('id', booking.courtSlotId);

                            if (slotError) {
                                console.error('Error updating slot:', slotError);
                            }

                            Alert.alert("Success", "Booking cancelled successfully");
                            fetchMyFacilityBookings();

                        } catch (error) {
                            console.error('Error:', error);
                            Alert.alert("Error", "Something went wrong");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <ScreenWrapper bg="white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <Header title="My Facility Bookings" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading bookings...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title="My Facility Bookings" />

            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#007AFF']}
                    />
                }
            >
                {bookings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>No Bookings Yet</Text>
                        <Text style={styles.emptyText}>
                            No one has booked your facilities yet. Promote your facilities to get bookings!
                        </Text>
                    </View>
                ) : (
                    <View style={styles.bookingsContainer}>
                        {bookings.map((booking) => {
                            const slot = booking.courtSlots;
                            const court = slot?.courts;
                            const facility = court?.facilities;
                            const user = booking.users;
                            const status = getBookingStatus(booking);

                            if (!slot || !court || !facility || !user) return null;

                            return (
                                <View key={booking.id} style={styles.bookingCard}>
                                    <View style={styles.bookingHeader}>
                                        <View style={styles.facilityInfo}>
                                            <Ionicons name="business" size={20} color={theme.colors.accent} />
                                            <Text style={styles.facilityName}>{facility.name}</Text>
                                        </View>
                                        
                                        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                                            <Ionicons name={status.icon} size={16} color="white" />
                                            <Text style={styles.statusText}>{status.text}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.bookingDetails}>
                                        <View style={styles.detailRow}>
                                            <Ionicons name="person" size={16} color="#666" />
                                            <Text style={styles.detailText}>
                                                {user.name || user.email?.split('@')[0] || 'User'}
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Ionicons name="mail" size={16} color="#666" />
                                            <Text style={styles.detailText}>{user.email}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Ionicons name="location" size={16} color="#666" />
                                            <Text style={styles.detailText}>{facility.location}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Ionicons name="tennisball" size={16} color="#666" />
                                            <Text style={styles.detailText}>{court.courtName}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Ionicons name="time" size={16} color="#666" />
                                            <Text style={styles.detailText}>
                                                {slot.startTime} - {slot.endTime}
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Ionicons name="calendar" size={16} color="#666" />
                                            <Text style={styles.detailText}>
                                                {getNextDateForDay(slot.dayOfWeek)}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.bookingFooter}>
                                        <Text style={styles.bookingDate}>
                                            Booked on {new Date(booking.created_at).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </Text>
                                        
                                        {status.text === 'Active' && (
                                            <Pressable 
                                                style={styles.cancelButton}
                                                onPress={() => onCancelBooking(booking)}
                                            >
                                                <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                                                <Text style={styles.cancelButtonText}>Cancel</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

export default MyFacilityBookings;

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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(8),
        paddingVertical: hp(10),
    },
    emptyTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: '600',
        color: '#666',
        marginTop: hp(2),
        marginBottom: hp(1),
    },
    emptyText: {
        fontSize: theme.fontSizes.base,
        color: '#999',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: hp(4),
    },
    bookingsContainer: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    bookingCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: hp(3),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    facilityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    facilityName: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.full,
    },
    statusText: {
        fontSize: theme.fontSizes.sm,
        fontWeight: '600',
        color: 'white',
    },
    bookingDetails: {
        gap: hp(1),
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    detailText: {
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    bookingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(2),
        paddingTop: hp(2),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    bookingDate: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.error + '10',
    },
    cancelButtonText: {
        fontSize: theme.fontSizes.sm,
        fontWeight: '600',
        color: theme.colors.error,
    },
});
