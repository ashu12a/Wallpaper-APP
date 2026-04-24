import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image';
import { getImageSize, wp } from '../helpers/common';
import { theme } from '../contants/theme';

const ImageCard = ({item,index,columns, router}) => {
    const imageUri = item?.webformatURL || item?.largeImageURL || item?.previewURL;

    const isLastInRow = ()=>{
        return (index+1) % columns === 0;
    }

    const getImageHeight = ()=>{
        let {imageHeight:height, imageWidth:width}  = item;
        return {height:getImageSize(height,width)};
    }
  return (
    <Pressable onPress={()=> router.push({pathname:'home/image', params:{...item}})} style={[styles.imageWrapper, !isLastInRow() && styles.spacing]}>
        {imageUri ? (
            <Image
              style={[styles.image,getImageHeight()]}
              source={{ uri: imageUri }}
              transition={100}
              contentFit='cover'
              cachePolicy='memory-disk'
              recyclingKey={`${item?.id ?? imageUri}`}
            />
        ) : (
            <View style={[styles.image, getImageHeight(), styles.fallbackImage]} />
        )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
    image:{
        height:300,
        width:'100%'
    },
    fallbackImage: {
        backgroundColor: theme.colors.grayBG
    },
    imageWrapper:{
        backgroundColor:theme.colors.grayBG,
        borderRadius:theme.radius.xl,
        borderCurve:'continuous',
        overflow:'hidden',
        marginBottom:wp(2),
    },
    spacing:{
        marginRight:wp(2)
    }
})

export default ImageCard