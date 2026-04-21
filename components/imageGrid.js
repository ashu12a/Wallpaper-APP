import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { MasonryFlashList } from '@shopify/flash-list';
import ImageCard from './imageCard';
import { getColumnCount, wp } from '../helpers/common';
import {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';

const AD_INTERVAL = 6;

const adUnitId = "ca-app-pub-1054886942898046/6665895598"; // your Android banner ad unit id

const ImageGrid = ({ images, router }) => {
  const columns = getColumnCount();

  const dataWithAds = useMemo(() => {
    if (!images?.length) return [];

    const result = [];

    images.forEach((item, index) => {
      result.push({
        type: 'image',
        id: `image-${item?.id ?? index}`,
        data: item,
      });

      if ((index + 1) % AD_INTERVAL === 0) {
        result.push({
          type: 'ad',
          id: `ad-${index}`,
        });
      }
    });

    return result;
  }, [images]);

  const renderItem = ({ item, index }) => {
    if (item.type === 'ad') {
      return (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.MEDIUM_RECTANGLE}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      );
    }

    return (
      <ImageCard
        router={router}
        item={item.data}
        columns={columns}
        index={index}
      />
    );
  };

  return (
    <View style={styles.container}>
      <MasonryFlashList
        data={dataWithAds}
        numColumns={columns}
        initialNumToRender={20}
        contentContainerStyle={styles.listContainerStyle}
        renderItem={renderItem}
        estimatedItemSize={200}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 3,
    width: wp(100),
  },
  listContainerStyle: {
    paddingHorizontal: wp(4),
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
});

export default ImageGrid;