package com.kms.repository;

import com.kms.entity.KnowledgeAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeRepository extends JpaRepository<KnowledgeAsset, Long> {

    List<KnowledgeAsset> findByCategory(String category);
    
    List<KnowledgeAsset> findByStatus(String status);
    
    List<KnowledgeAsset> findByCategoryAndStatus(String category, String status);

    @Query("SELECT k FROM KnowledgeAsset k WHERE " +
           "(LOWER(k.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(k.summary) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(k.rootCause) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR EXISTS (SELECT t FROM k.tags t WHERE LOWER(t) LIKE LOWER(CONCAT('%', :search, '%')))) " +
           "AND (:status IS NULL OR k.status = :status)")
    List<KnowledgeAsset> searchByKeywordAndStatus(@Param("search") String search, @Param("status") String status);
}
