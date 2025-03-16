
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/BottomNavigation";

interface IngredientMapping {
  id: string;
  canonical_name: string;
  variant_names: string[];
  category?: string;
}

const AdminIngredients = () => {
  const navigate = useNavigate();
  const [mappings, setMappings] = useState<IngredientMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMapping, setNewMapping] = useState({
    canonical_name: '',
    variant_name: '',
    category: ''
  });

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ingredient_mappings')
        .select('*')
        .order('canonical_name', { ascending: true });

      if (error) {
        throw error;
      }

      setMappings(data || []);
    } catch (error) {
      console.error("Error fetching ingredient mappings:", error);
      toast.error("Failed to load ingredient mappings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMapping(prev => ({ ...prev, [name]: value }));
  };

  const addVariant = async (mappingId: string, variantName: string) => {
    if (!variantName.trim()) return;

    try {
      // Get the current mapping
      const mapping = mappings.find(m => m.id === mappingId);
      if (!mapping) return;

      // Check if variant already exists
      if (mapping.variant_names.includes(variantName)) {
        toast.error("This variant already exists");
        return;
      }

      // Update the mapping with the new variant
      const updatedVariants = [...mapping.variant_names, variantName];
      const { error } = await supabase
        .from('ingredient_mappings')
        .update({ variant_names: updatedVariants })
        .eq('id', mappingId);

      if (error) {
        throw error;
      }

      // Update local state
      setMappings(prevMappings => 
        prevMappings.map(m => 
          m.id === mappingId 
            ? { ...m, variant_names: updatedVariants } 
            : m
        )
      );

      toast.success("Variant added successfully");
      setNewMapping(prev => ({ ...prev, variant_name: '' }));
    } catch (error) {
      console.error("Error adding variant:", error);
      toast.error("Failed to add variant");
    }
  };

  const removeVariant = async (mappingId: string, variantToRemove: string) => {
    try {
      // Get the current mapping
      const mapping = mappings.find(m => m.id === mappingId);
      if (!mapping) return;

      // Filter out the variant to remove
      const updatedVariants = mapping.variant_names.filter(v => v !== variantToRemove);
      
      // Update the mapping with the filtered variants
      const { error } = await supabase
        .from('ingredient_mappings')
        .update({ variant_names: updatedVariants })
        .eq('id', mappingId);

      if (error) {
        throw error;
      }

      // Update local state
      setMappings(prevMappings => 
        prevMappings.map(m => 
          m.id === mappingId 
            ? { ...m, variant_names: updatedVariants } 
            : m
        )
      );

      toast.success("Variant removed successfully");
    } catch (error) {
      console.error("Error removing variant:", error);
      toast.error("Failed to remove variant");
    }
  };

  const addNewIngredient = async () => {
    if (!newMapping.canonical_name.trim()) {
      toast.error("Please enter an ingredient name");
      return;
    }

    try {
      const variants = newMapping.variant_name.trim() 
        ? [newMapping.variant_name] 
        : [];

      const { data, error } = await supabase
        .from('ingredient_mappings')
        .insert({
          canonical_name: newMapping.canonical_name,
          variant_names: variants,
          category: newMapping.category || null
        })
        .select();

      if (error) {
        throw error;
      }

      // Update local state
      if (data && data.length > 0) {
        setMappings(prev => [...prev, data[0]]);
      }

      // Reset form
      setNewMapping({
        canonical_name: '',
        variant_name: '',
        category: ''
      });

      toast.success("Ingredient mapping added successfully");
    } catch (error) {
      console.error("Error adding ingredient mapping:", error);
      toast.error("Failed to add ingredient mapping");
    }
  };

  const deleteMapping = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ingredient_mappings')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setMappings(prevMappings => prevMappings.filter(m => m.id !== id));
      toast.success("Ingredient mapping deleted successfully");
    } catch (error) {
      console.error("Error deleting ingredient mapping:", error);
      toast.error("Failed to delete ingredient mapping");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-recipe-green-light border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Manage Ingredient Mappings</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Ingredient Mapping</CardTitle>
            <CardDescription>
              Create mappings between canonical ingredient names and their variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="canonical_name" className="block text-sm font-medium mb-1">
                  Canonical Name
                </label>
                <Input
                  id="canonical_name"
                  name="canonical_name"
                  value={newMapping.canonical_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Chicken Breast"
                />
              </div>
              <div>
                <label htmlFor="variant_name" className="block text-sm font-medium mb-1">
                  Variant Name (Optional)
                </label>
                <Input
                  id="variant_name"
                  name="variant_name"
                  value={newMapping.variant_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Boneless Chicken"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Category (Optional)
                </label>
                <Input
                  id="category"
                  name="category"
                  value={newMapping.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Meat"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={addNewIngredient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingredient Mappings</CardTitle>
            <CardDescription>
              Manage your ingredient mappings and variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading ingredient mappings...</div>
            ) : mappings.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No ingredient mappings found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canonical Name</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">{mapping.canonical_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {mapping.variant_names.map((variant, idx) => (
                            <div 
                              key={idx} 
                              className="bg-gray-100 rounded px-2 py-1 text-xs flex items-center"
                            >
                              {variant}
                              <button 
                                onClick={() => removeVariant(mapping.id, variant)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                <Trash className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-7 text-xs w-32"
                              placeholder="Add variant"
                              value={newMapping.variant_name}
                              onChange={handleInputChange}
                              name="variant_name"
                            />
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7"
                              onClick={() => addVariant(mapping.id, newMapping.variant_name)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{mapping.category || '-'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteMapping(mapping.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default AdminIngredients;
