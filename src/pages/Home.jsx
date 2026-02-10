import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import HomeSlider from '../components/HomeSlider'
import FeaturedCategories from '../components/FeaturedCategories'
import ProductsList from '../components/ProductsList'
import RecommendedProducts from '../components/RecommendedProducts'
import NewArrivalsBannerWithSwiper from '../components/NewArrivalsBannerWithSwiper'
import VideoAdsSection from '../components/VideoAdsSection'
import CtaBanner from '../components/CtaBanner'
import PopularGoodsChips from '../components/PopularGoodsChips'
import { MainLayout } from '../components/Layout'
import { ROUTES } from '../routes'
import { categoryService } from "../services/categoryService";

export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [preferredCategories, setPreferredCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Default categories fallback
  const defaultTitles = [t("categories.smartphones"), t("categories.clothing")];

  // Fetch preferred categories or default categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        
        // Check if user has preferred categories
        let preferredCategoryIds = [];
        if (isAuthenticated && user?.userType === 'CLIENT' && user?.preferredCategories) {
          // Parse preferredCategories if it's a string
          if (typeof user.preferredCategories === 'string') {
            try {
              preferredCategoryIds = JSON.parse(user.preferredCategories);
            } catch (e) {
              preferredCategoryIds = [];
            }
          } else if (Array.isArray(user.preferredCategories)) {
            preferredCategoryIds = user.preferredCategories;
          }
        }

        // If user has preferred categories, fetch category details
        if (preferredCategoryIds.length > 0) {
          const categoriesData = [];
          for (const categoryId of preferredCategoryIds.slice(0, 2)) { // Max 2 categories
            try {
              const response = await categoryService.getCategoryById(categoryId);
              if (response.data && response.data.success && response.data.data) {
                const cat = response.data.data;
                // Convert nameKey to translated label
                const translationKey = cat.nameKey 
                  ? cat.nameKey.replace(/^category\./, 'categories.') 
                  : "categories.unknown";
                const translatedLabel = t(translationKey);
                const label = translatedLabel !== translationKey ? translatedLabel : (cat.nameKey || t("categories.unknown"));
                
                categoriesData.push({
                  id: cat.id,
                  title: label
                });
              }
            } catch (error) {
              console.error(`Error fetching category ${categoryId}:`, error);
            }
          }
          setPreferredCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [isAuthenticated, user, t]);

  const handleCategorySelect = (category) => {
    // Navigate to products list with category filter
    navigate(`${ROUTES.PRODUCTS_LIST}?category=${encodeURIComponent(category)}`);
  };

  // Determine which categories to display
  const categoriesToDisplay = preferredCategories.length > 0 
    ? preferredCategories 
    : defaultTitles.map((title, index) => ({ id: null, title }));

  
  return (
    <MainLayout>
      <HomeSlider/>
      <VideoAdsSection/>
      <FeaturedCategories/>
      
      {/* Display products from preferred categories or default categories */}
      {!loadingCategories && categoriesToDisplay.length > 0 && (
        <>
          {categoriesToDisplay.map((category, index) => (
            <ProductsList 
              key={category.id || index}
              title={category.title} 
              categoryId={category.id || null}
              limit={8}
            />
          ))}
        </>
      )}
      
      {/* Fallback while loading */}
      {loadingCategories && (
        <>
          <ProductsList title={defaultTitles[0]} limit={8}/>
          <ProductsList title={defaultTitles[1]} limit={8}/>
        </>
      )}
      
       <NewArrivalsBannerWithSwiper/>
      <RecommendedProducts/>
      {isAuthenticated && user?.userType !== 'TRADER' && <CtaBanner/>}
      <PopularGoodsChips onSelect={handleCategorySelect}/>
    </MainLayout>
  )
}
