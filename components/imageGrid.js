import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ImageCard from './imageCard';
import { getColumnCount, wp } from '../helpers/common';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const AD_INTERVAL = 6;

// while testing, use TestIds.BANNER
const adUnitId = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-1054886942898046/6665895598';

const ImageGrid = ({ images = [], router }) => {
  const columns = getColumnCount();

  const dataWithAds = useMemo(() => {
    if (!images.length) return [];

    const result = [];

    images.forEach((item, index) => {
      const imageId = item?.id ?? item?.webformatURL ?? item?.largeImageURL ?? index;
      result.push({
        type: 'image',
        id: `image-${imageId}`,
        data: item,
      });

      if ((index + 1) % AD_INTERVAL === 0) {
        result.push({
          type: 'ad',
          id: `ad-${index + 1}`,
        });
      }
    });

    return result;
  }, [images]);

  const renderItem = useCallback(
    ({ item, index }) => {
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
    },
    [router, columns]
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={dataWithAds}
        masonry
        numColumns={columns}
        estimatedItemSize={280}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.type}
        overrideItemLayout={(layout, item) => {
          if (item.type === 'ad') {
            layout.span = columns; // full width ad
          } else {
            layout.span = 1;
          }
        }}
        contentContainerStyle={styles.listContainerStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: wp(100),
  },
  listContainerStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 12,
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
});

export default ImageGrid;