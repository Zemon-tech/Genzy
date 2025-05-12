import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import CollectionList from '../../components/admin/CollectionList';
import { Sparkles, Grid3X3 } from 'lucide-react';

const COLORS = {
  black: "#292728",
  white: "#feffee",
  gold: "#eaaa07"
};

const HavendripCollection = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
      style={{ backgroundColor: COLORS.white }}
    >
      <div 
        className="rounded-2xl p-8 shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${COLORS.black} 0%, #3a3939 100%)`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.15), 0 1px 3px rgba(234,170,7,0.2), 0 1px 0 rgba(255,255,255,0.05) inset` 
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#eaaa07]" />
              <h1 className="text-3xl font-extrabold text-[#feffee]">Havendrip Collections</h1>
            </div>
            <p className="text-[#feffee]/80 mt-2 max-w-2xl">
              Manage your curated collections for a seamless shopping experience. Create, edit, and organize products into themed groupings.
            </p>
          </div>
          <Button
            className="whitespace-nowrap flex items-center gap-2 bg-[#eaaa07] hover:bg-[#eaaa07]/90 text-[#292728]"
            onClick={() => document.getElementById('collection-name')?.focus()}
          >
            <Grid3X3 className="w-5 h-5" />
            New Collection
          </Button>
        </div>
      </div>
      
      <CollectionList />
    </motion.div>
  );
};

export default HavendripCollection; 