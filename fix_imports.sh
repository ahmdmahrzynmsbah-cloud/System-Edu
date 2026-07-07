#!/bin/bash
sed -i 's/import { Student, Teacher, ClassRoom/import { Student, Teacher, ClassRoom, Book, BookPayment/g' src/utils/db.ts
