import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons';
import { theme } from '../../contants/theme';
import { hp, wp } from '../../helpers/common';
import { useState } from 'react';
import { useRef } from 'react';
import Categories from '../../components/categories';
import { useEffect } from 'react';
import { apiCall } from '../../api';
import ImageGrid from '../../components/imageGrid';
import { useCallback } from 'react';
import { debounce } from 'lodash';
import FiltersModal from '../../components/filtersModal';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

var page = 1;

const HomeScreen = () => {
    const { top } = useSafeAreaInsets(); // if device having camera notch
    const paddingTop = top > 0 ? top + 10 : 30;
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [images, setImages] = useState([]);
    const [filters, setFilters] = useState(null);
    const [isEndReached, setIsEndReached] = useState(false);
    const searchInputRef = useRef(null);
    const scrollRef = useRef(null);
    const router = useRouter();

    const modalRef = useRef(null);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async (params = { page: 1 }, append = true) => {
        let res = await apiCall(params);
        if (res?.success && res?.data?.hits) {
            if (append) {
                setImages([...images, ...res.data.hits]);
            } else {
                setImages([...res.data.hits]);
            }
        }
    }

    const openFilterModal = () => {
        modalRef?.current?.present();
    }

    const closeFilterModal = () => {
        modalRef?.current?.close();
    }

    const applyFilters = () => {
        if (filters) {
            page = 1;
            setImages([]);
            let params = {
                page,
                ...filters
            }
            if (activeCategory) params.category = activeCategory;

            if (search) params.q = search;

            fetchImages(params, false);
        }
        closeFilterModal();
    }

    const resetFilters = () => {
        if (filters) {
            page = 1;
            setImages([]);
            setFilters(null);
            let params = {
                page,
            }
            if (activeCategory) params.category = activeCategory;

            if (search) params.q = search;

            fetchImages(params, false);
        }
        closeFilterModal();
    }

    const clearThisFilter = (filterName) => {
        let filterz = { ...filters };
        delete filterz[filterName];
        setFilters({ ...filterz });
        page = 1;
        setImages([]);
        let params = {
            page,
            ...filterz
        }
        if (activeCategory) params.category = activeCategory;

        if (search) params.q = search;

        fetchImages(params, false);
    }

    const handleChangeCategory = (cat) => {
        setActiveCategory(cat);
        clearSearch("");
        setImages([]);
        page = 1;
        let params = {
            page,
            ...filters
        }
        if (cat) params.category = cat;
        fetchImages(params, false);
    }

    const handleSearch = (text) => {
        setSearch(text);
        if (text.length > 2) {
            // search for this text
            page = 1;
            setImages([]);
            setActiveCategory(null);  //reset category while searching
            fetchImages({ page, q: text, ...filters }, false);
        }

        if (text.length == "") {
            // reset result
            page = 1;
            searchInputRef?.current?.clear();
            setImages([]);
            setActiveCategory(null);
            fetchImages({ page, ...filters }, false);
        }
    }

    const clearSearch = () => {
        setSearch("");
        searchInputRef?.current?.clear();
    }

    const handleScroll = (event) => {
        const contentHeight = event.nativeEvent.contentSize.height;
        const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
        const scrollOffset = event.nativeEvent.contentOffset.y;
        const bottomPosition = contentHeight - scrollViewHeight;

        if (scrollOffset >= bottomPosition - 1) {
            if (!isEndReached) {
                setIsEndReached(true);
                //fetch more images
                ++page;
                let params = {
                    page,
                    ...filters,
                }
                if (activeCategory) params.category = activeCategory;

                if (search) params.q = search;

                fetchImages(params,true);

            }
        } else if (isEndReached) {
            setIsEndReached(false);
        }

    }

    const handleScrollUp = () => {
        scrollRef?.current?.scrollTo({
            y: 0,
            animated: true
        })
    }

    const handleTextDebounce = useCallback(debounce(handleSearch, 400), []);


    return (
        <View style={[styles.container, { paddingTop }]}>
            {/* header  */}
            <View style={styles.header}>
                <Pressable onPress={handleScrollUp}>
                    <Text style={styles.title}>Pixels</Text>
                </Pressable>
                <Pressable onPress={openFilterModal}>
                    <FontAwesome6 name="bars-staggered" size={22} color={theme.colors.neutral(0.7)} />
                </Pressable>
            </View>

            <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={5} //how often scroll event will fire while scrolling (in ms)
                ref={scrollRef}
                contentContainerStyle={{ gap: 15 }}
            >
                {/* search bar  */}
                <View style={styles.searchBar}>
                    <View style={styles.searchIcon}>
                        <Feather name="search" size={24} color={theme.colors.neutral(0.4)} />
                    </View>
                    <TextInput
                        placeholder='Search for photos...'
                        // value={search}
                        ref={searchInputRef}
                        onChangeText={handleTextDebounce}
                        style={styles.searchInput}
                    />
                    {search && <Pressable style={styles.closeIcon} onPress={() => handleSearch("")}>
                        <Ionicons name='close' size={24} color={theme.colors.neutral(0.6)} />
                    </Pressable>}
                </View>

                {/* categories  */}
                <Categories activeCategory={activeCategory} handleChangeCategory={handleChangeCategory} />

                {/* applied filters  */}
                {filters && <View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filters}
                    >
                        {
                            Object.keys(filters).map((key, index) => {
                                return (
                                    <View key={key} style={styles.filterItem}>
                                        {key == 'colors' ? (
                                            <View
                                                style={{
                                                    height: 20,
                                                    width: 20,
                                                    borderRadius: 7,
                                                    backgroundColor: filters[key]
                                                }}
                                            ></View>
                                        ) : (
                                            <Text style={styles.filterItemText}>{filters[key]}</Text>
                                        )}
                                        <Pressable style={styles.filterCloseIcon} onPress={() => clearThisFilter(key)}>
                                            <Ionicons name='close' size={14} color={theme.colors.neutral(0.9)} />
                                        </Pressable>
                                    </View>
                                )
                            })
                        }

                    </ScrollView>
                </View>}

                {/* images masonry grid  */}
                <View>
                    {
                        images?.length > 0 && <ImageGrid images={images} router={router}/>
                    }
                </View>

                {/* loading */}
                <View style={{ flex: 1, alignItems: 'center', marginBottom: 70, marginTop: images.length > 0 ? 10 : 70 }}>
                    {/* <ActivityIndicator size="large"/> */}
                    <Image
                        source={require('../../assets/images/loader.gif')}
                        style={styles.loader}
                    />
                </View>

            </ScrollView>

            {/* filters model  */}
            <FiltersModal
                modalRef={modalRef}
                filters={filters}
                setFilters={setFilters}
                onClose={closeFilterModal}
                onApply={applyFilters}
                onReset={resetFilters}
            />

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 15
    },
    header: {
        marginHorizontal: wp(4),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: hp(4),
        fontWeight: theme.fontWeights.semibold,
        color: theme.colors.neutral(0.9)
    },
    searchBar: {
        marginHorizontal: wp(4),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.grayBG,
        backgroundColor: theme.colors.white,
        padding: 6,
        paddingLeft: 10,
        borderRadius: theme.radius.lg
    },
    searchIcon: {
        padding: 8,
    },
    searchInput: {
        flex: 1,
        borderRadius: theme.radius.sm,
        paddingVertical: 10,
        fontSize: hp(1.8)
    },
    close: {
        backgroundColor: theme.colors.neutral(0.1),
        padding: 8,
        borderRadius: theme.radius.sm

    },
    loader: {
        width: 50,
        height: 50,
    },
    filters: {
        paddingHorizontal: wp(4),
        gap: 10
    },
    filterItem: {
        backgroundColor: theme.colors.grayBG,
        padding: 8,
        flexDirection: 'row',
        borderRadius: theme.radius.xs,
        gap: 10,
        paddingHorizontal: 10,
        alignItems: 'center'
    },
    filterItemText: {
        fontSize: hp(1.8)
    },
    filterCloseIcon: {
        backgroundColor: theme.colors.neutral(0.2),
        padding: 4,
        borderRadius: 7
    }
})
export default HomeScreen