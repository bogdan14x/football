PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX p: <http://dbpedia.org/property/>          
SELECT * WHERE {
      ?player p:currentclub  <http://dbpedia.org/resource/Manchester_United_F.C.>.
      OPTIONAL {?player p:dateOfBirth ?dob}.
      OPTIONAL {?player p:position ?position}.
      OPTIONAL {?player p:image ?image}.
   }

   SELECT * WHERE {
     ?player a <http://dbpedia.org/ontology/SoccerPlayer> .
     ?player <http://dbpedia.org/ontology/birthDate> ?birthDate .
     ?player <http://dbpedia.org/ontology/Person/height> ?height .
     ?player <http://dbpedia.org/ontology/position> ?position .
   }




   PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX : <http://dbpedia.org/resource/>
PREFIX dbpedia2: <http://dbpedia.org/property/>
PREFIX dbpedia: <http://dbpedia.org/>
PREFIX dbo: <http://dbpedia.org/ontology/>
SELECT ?f ?l ?a ?m ?g (group_concat(distinct ?n; separator=", ") as ?names)
WHERE {
?f rdf:type dbo:SoccerClub .
?f dbpedia2:clubname ?l .
?f dbpedia2:name ?n .
?f dbpedia2:ground ?g .
?f dbo:abstract ?a .
?f dbo:manager ?m
FILTER (regex (?l, "Manchester United", "i") && (langMatches(lang(?a),"en")))
}
