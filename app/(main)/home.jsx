import Avatar from '@/components/Avatar'
import ScreenWrapper from '@/components/ScreenWrapper'
import { theme } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { wp } from '@/helpers/common'
import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

const Home = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    console.log("user", user);

    const fetchFacilities = async () => {
        try {
            const { data, error } = await supabase
                .from('facilities')
                .select(`
                    *,
                    courts (
                        *,
                        courtSlots (*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching facilities:', error);
                return;
            }

            setFacilities(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchFacilities();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchFacilities();
    }, []);

    const onLogout = async () => {
        const {error} = await supabase.auth.signOut();
        if (error) {
            Alert.alert("Logout Failed", "Please try again", error.message);
        }
    }

    const onFacilityPress = (facility) => {
        router.push({
            pathname: 'facility',
            params: { id: facility.id }
        });
    };



    return (
        <ScreenWrapper bg="white" style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.logo}>PickleUp</Text>
                </View>
                
                <View style={styles.headerRight}>
                    <Pressable 
                        style={styles.notificationButton} 
                        onPress={() => router.push('notifications')}
                    >
                        <View style={styles.notificationIcon}>
                            <Ionicons name="notifications-outline" size={24} color="#666" />
                        </View>
                    </Pressable>
                    
                    <Pressable 
                        style={styles.addButton} 
                        onPress={() => router.push('newPost')}
                    >
                        <View style={styles.addIcon}>
                            <Ionicons name="add" size={24} color="#666" />
                        </View>
                    </Pressable>
                    
                    <Pressable 
                        style={styles.profileButton} 
                        onPress={() => router.push('profile')}
                    >
                       <Avatar
                           uri={user?.image}
                           size={48}
                           rounded={24}
                       />
                    </Pressable>
                </View>
            </View>

            <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#007AFF']}
                    />
                }
            >
                                            <View style={styles.welcomeSection}>
                                <Text style={styles.welcomeText}>
                                    Hello, {user?.name || user?.email?.split('@')[0] || 'Player'} 🏓
                                </Text>
                                <Text style={styles.subText}>
                                    Discover pickleball facilities near you
                                </Text>
                            </View>

                <View style={styles.facilitiesSection}>
                    <Text style={styles.sectionTitle}>Available Facilities</Text>
                    
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading facilities...</Text>
                        </View>
                    ) : facilities.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="business-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No facilities available</Text>
                            <Text style={styles.emptySubtext}>Be the first to create a facility!</Text>
                        </View>
                    ) : (
                        <View style={styles.facilitiesGrid}>
                                                                    {facilities.map((facility) => (
                                            <Pressable
                                                key={facility.id}
                                                style={styles.facilityCard}
                                                onPress={() => onFacilityPress(facility)}
                                            >
                                                {facility.image && (
                                                    <View style={styles.facilityImageContainer}>
                                                        <Image 
                                                            source={{ uri: facility.image }} 
                                                            style={styles.facilityImage}
                                                            resizeMode="cover"
                                                        />
                                                    </View>
                                                )}
                                                
                                                <View style={styles.cardContent}>
                                                    <View style={styles.cardHeader}>
                                                        <Ionicons name="business" size={24} color={theme.colors.accent} />
                                                        <Text style={styles.facilityName}>{facility.name}</Text>
                                                    </View>
                                                    
                                                    <View style={styles.cardDetails}>
                                                        <View style={styles.detailRow}>
                                                            <Ionicons name="location" size={16} color="#666" />
                                                            <Text style={styles.detailText}>{facility.location}</Text>
                                                        </View>
                                                        
                                                        {facility.description && (
                                                            <Text style={styles.description} numberOfLines={2}>
                                                                {facility.description}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    
                                                    <View style={styles.cardFooter}>
                                                        <View style={styles.statsContainer}>
                                                            <View style={styles.statItem}>
                                                                <View style={styles.statIconContainer}>
                                                                    <Ionicons name="tennisball" size={14} color="white" />
                                                                </View>
                                                                <Text style={styles.statText}>
                                                                    {facility.courts?.length || 0} Courts
                                                                </Text>
                                                            </View>
                                                            <View style={styles.statDivider} />
                                                            <View style={styles.statItem}>
                                                                <View style={styles.statIconContainer}>
                                                                    <Ionicons name="time" size={14} color="white" />
                                                                </View>
                                                                <Text style={styles.statText}>
                                                                    {facility.courts?.reduce((total, court) => 
                                                                        total + (court.courtSlots?.filter(slot => !slot.isBooked).length || 0), 0
                                                                    )} Available
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </Pressable>
                                        ))}
                        </View>
                    )}
                </View>

                <View style={styles.logoutSection}>
                    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
    },
    headerLeft: {
        flex: 1,
    },
    logo: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    notificationButton: {
        padding: 0,
    },
    notificationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        padding: 0,
    },
    addIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileButton: {
        marginLeft: 0,
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    content: {
        flex: 1,
    },
    welcomeSection: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
        lineHeight: 34,
    },
    subText: {
        fontSize: 16,
        color: '#8E8E93',
        lineHeight: 22,
    },
    facilitiesSection: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 12,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    facilitiesGrid: {
        gap: 16,
    },
    facilityCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    facilityImageContainer: {
        height: 120,
        width: '100%',
    },
    facilityImage: {
        width: '100%',
        height: '100%',
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    facilityName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginLeft: 8,
        flex: 1,
    },
    cardDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginTop: 4,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: wp(6),
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    statIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    statText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.primary,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: theme.colors.border,
        opacity: 0.5,
    },
    logoutSection: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
})